import { pool } from '../config/db.js';

const create = async ({ user_id, username, email, password_hash, role }) => {
  const query = `
    INSERT INTO users (user_id, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id, username, email, role, is_active, created_at, updated_at;
  `;
  const values = [user_id, username, email, password_hash, role];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const findByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1;';
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

const findByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1;';
  try {
    const result = await pool.query(query, [username]);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
};

const findById = async (userId) => {
  const query = 'SELECT * FROM users WHERE user_id = $1;';
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

const findAll = async () => {
  const query = 'SELECT user_id, username, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC;';
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding all users:', error);
    throw error;
  }
};

// Tambahkan fungsi update, delete, dll. sesuai kebutuhan

export default {
  create,
  findByEmail,
  findByUsername,
  findById,
  findAll,
};