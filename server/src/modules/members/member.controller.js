// 提供后台成员账号的查询、新增、更新、重置密码和启停接口。
import { HttpError } from '../../core/errors.js';
import { auditActions } from '../audit/audit.actions.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { hashPassword } from '../auth/password.js';
import { getPermissionsForRole, getRoleProfile, getRoleSummaries, isKnownRole } from '../roles/role.service.js';
import {
  countActiveSuperAdmins,
  createAdminMember,
  findAdminMemberByEmail,
  findAdminMemberById,
  listAdminMembers,
  updateAdminMember,
  updateAdminMemberPassword,
  updateAdminMemberStatus
} from './member.repository.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function serializeMember(member) {
  const roleProfile = await getRoleProfile(member.role);

  return {
    ...member,
    roleName: roleProfile.name,
    permissions: await getPermissionsForRole(member.role)
  };
}

function auditMemberSnapshot(member) {
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    isActive: member.isActive
  };
}

function readMemberId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '成员 ID 不正确');
  }

  return id;
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    throw new HttpError(400, '请输入成员姓名');
  }

  const normalizedName = name.trim();

  if (!normalizedName || normalizedName.length > 64) {
    throw new HttpError(400, '成员姓名长度需要在 1 到 64 个字符之间');
  }

  return normalizedName;
}

function normalizeEmail(email) {
  if (typeof email !== 'string') {
    throw new HttpError(400, '请输入成员邮箱');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 128) {
    throw new HttpError(400, '成员邮箱格式不正确');
  }

  return normalizedEmail;
}

async function normalizeRole(role) {
  if (typeof role !== 'string' || !(await isKnownRole(role))) {
    throw new HttpError(400, '请选择有效角色');
  }

  return role;
}

function normalizePassword(password) {
  if (typeof password !== 'string' || password.trim().length < 8 || password.length > 72) {
    throw new HttpError(400, '密码长度需要在 8 到 72 个字符之间');
  }

  return password;
}

async function findMemberOrThrow(id) {
  const member = await findAdminMemberById(id);

  if (!member) {
    throw new HttpError(404, '成员不存在');
  }

  return member;
}

async function ensureSafeMemberChange({ currentAdminId, member, nextRole, nextIsActive }) {
  const isCurrentAdmin = Number(currentAdminId) === Number(member.id);

  if (isCurrentAdmin && nextIsActive === false) {
    throw new HttpError(400, '不能停用当前登录账号');
  }

  if (isCurrentAdmin && member.role !== nextRole) {
    throw new HttpError(400, '不能修改当前登录账号的角色');
  }

  const removesActiveSuperAdmin =
    member.role === 'super_admin' && member.isActive && (nextRole !== 'super_admin' || nextIsActive === false);

  if (!removesActiveSuperAdmin) {
    return;
  }

  const activeSuperAdminCount = await countActiveSuperAdmins();

  if (activeSuperAdminCount <= 1) {
    throw new HttpError(400, '至少需要保留一个启用的超级管理员');
  }
}

export async function listMembers(_req, res) {
  const members = await listAdminMembers();

  res.status(200).json({
    members: await Promise.all(members.map(serializeMember)),
    roles: await getRoleSummaries({ onlyActive: true })
  });
}

export async function createMember(req, res) {
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const role = await normalizeRole(req.body?.role);
  const password = normalizePassword(req.body?.password);
  const existedMember = await findAdminMemberByEmail(email);

  if (existedMember) {
    throw new HttpError(409, '该邮箱已经存在');
  }

  const passwordHash = await hashPassword(password);
  const member = await createAdminMember({
    email,
    name,
    passwordHash,
    role
  });
  await recordAuditLog(req, {
    action: auditActions.memberCreate,
    targetType: 'admin_user',
    targetId: member.id,
    targetLabel: member.email,
    detail: {
      after: auditMemberSnapshot(member)
    }
  });

  res.status(201).json({
    member: await serializeMember(member)
  });
}

export async function updateMember(req, res) {
  const id = readMemberId(req);
  const member = await findMemberOrThrow(id);
  const name = normalizeName(req.body?.name ?? member.name);
  const role = await normalizeRole(req.body?.role ?? member.role);

  await ensureSafeMemberChange({
    currentAdminId: req.admin.id,
    member,
    nextRole: role,
    nextIsActive: member.isActive
  });

  const updatedMember = await updateAdminMember(id, {
    name,
    role
  });
  await recordAuditLog(req, {
    action: auditActions.memberUpdate,
    targetType: 'admin_user',
    targetId: updatedMember.id,
    targetLabel: updatedMember.email,
    detail: {
      before: auditMemberSnapshot(member),
      after: auditMemberSnapshot(updatedMember)
    }
  });

  res.status(200).json({
    member: await serializeMember(updatedMember)
  });
}

export async function resetMemberPassword(req, res) {
  const id = readMemberId(req);
  const password = normalizePassword(req.body?.password);
  const member = await findMemberOrThrow(id);
  const passwordHash = await hashPassword(password);
  const updatedMember = await updateAdminMemberPassword(member.id, passwordHash);
  await recordAuditLog(req, {
    action: auditActions.memberResetPassword,
    targetType: 'admin_user',
    targetId: updatedMember.id,
    targetLabel: updatedMember.email,
    detail: {
      member: auditMemberSnapshot(updatedMember)
    }
  });

  res.status(200).json({
    member: await serializeMember(updatedMember)
  });
}

export async function updateMemberStatus(req, res) {
  const id = readMemberId(req);
  const member = await findMemberOrThrow(id);

  if (typeof req.body?.isActive !== 'boolean') {
    throw new HttpError(400, '请选择成员启用状态');
  }

  await ensureSafeMemberChange({
    currentAdminId: req.admin.id,
    member,
    nextRole: member.role,
    nextIsActive: req.body.isActive
  });

  const updatedMember = await updateAdminMemberStatus(id, req.body.isActive);
  await recordAuditLog(req, {
    action: updatedMember.isActive ? auditActions.memberEnable : auditActions.memberDisable,
    targetType: 'admin_user',
    targetId: updatedMember.id,
    targetLabel: updatedMember.email,
    detail: {
      before: auditMemberSnapshot(member),
      after: auditMemberSnapshot(updatedMember)
    }
  });

  res.status(200).json({
    member: await serializeMember(updatedMember)
  });
}
