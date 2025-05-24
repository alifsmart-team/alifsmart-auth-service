import { pool } from '../config/db.js';

const create = async ({ userId, actionType, ipAddress, details }) => {
  const query = `
    INSERT INTO audit_logs (user_id, action_type, ip_address, details)
    VALUES ($1, $2, $3, $4)
    RETURNING log_id, user_id, action_type, ip_address, details, timestamp;
  `;
  // Pastikan details adalah string JSON jika kolomnya JSONB atau JSON
  const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);
  const values = [userId, actionType, ipAddress, detailsJson];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Jangan throw error di sini agar tidak mengganggu flow utama jika audit log gagal
    // Cukup log errornya
  }
};

const findAll = async ({ page = 1, limit = 20, userId, actionType } = {}) => {
  let baseQuery = 'SELECT log_id, user_id, u.email as user_email, action_type, ip_address, details, timestamp FROM audit_logs al LEFT JOIN users u ON al.user_id = u.user_id';
  const conditions = [];
  const queryParams = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`al.user_id = $${paramIndex++}`);
    queryParams.push(userId);
  }
  if (actionType) {
    conditions.push(`action_type ILIKE $${paramIndex++}`);
    queryParams.push(`%${actionType}%`);
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  baseQuery += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
  queryParams.push(limit, (page - 1) * limit);

  try {
    const result = await pool.query(baseQuery, queryParams);
    // Dapatkan total count untuk pagination
    let countQuery = 'SELECT COUNT(*) FROM audit_logs';
    if (conditions.length > 0) {
      // Buat query count dengan kondisi yang sama tapi tanpa parameter limit & offset
      const countConditions = [];
      const countQueryParamsOnly = [];
      let countParamIndex = 1;
      if (userId) {
        countConditions.push(`user_id = $${countParamIndex++}`);
        countQueryParamsOnly.push(userId);
      }
      if (actionType) {
        countConditions.push(`action_type ILIKE $${countParamIndex++}`);
        countQueryParamsOnly.push(`%${actionType}%`);
      }
       if (countConditions.length > 0) {
        countQuery += ' WHERE ' + countConditions.join(' AND ');
       }
       const totalResult = await pool.query(countQuery, countQueryParamsOnly);
       const total = parseInt(totalResult.rows[0].count, 10);
       return { logs: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    } else {
        const totalResult = await pool.query(countQuery);
        const total = parseInt(totalResult.rows[0].count, 10);
        return { logs: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }


  } catch (error) {
    console.error('Error finding audit logs:', error);
    throw error;
  }
};


export default {
  create,
  findAll,
};