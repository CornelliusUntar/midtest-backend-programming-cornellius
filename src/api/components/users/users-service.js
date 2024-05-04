const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');

/**
 * Get list of users
 * @returns {Array}
 */

async function getUsers(page = 1, limit, search = '', sort) {
  const users = await usersRepository.getUsers();

  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase();
    if (searchTerm.includes(':')) {
      const [field, term] = searchTerm.split(':');
      if (field === 'email') {
        return user.email.toLowerCase().includes(term);
      } else if (field === 'name') {
        return user.name.toLowerCase().includes(term);
      } else {
        return false;
      }
    } else {
      return (
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
  });

  let sortedUsers;
  if (sort) {
    const [field, direction] = sort.split(':');
    sortedUsers = filteredUsers.slice().sort((a, b) => {
      const compareValue = (field) => {
        if (field === 'name') return a.name.localeCompare(b.name);
        if (field === 'email') return a.email.localeCompare(b.email);
        return 0;
      };
      return direction === 'asc'
        ? compareValue(field)
        : compareValue(field) * -1;
    });
  } else {
    sortedUsers = filteredUsers.slice(); // default to no sorting
  }

  const startIndex = (page - 1) * limit;
  const endIndex = limit
    ? Math.min(startIndex + limit, sortedUsers.length)
    : sortedUsers.length;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const results = paginatedUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));

  const totalUsers = sortedUsers.length;
  const totalPages = Math.ceil(totalUsers / (limit || sortedUsers.length));
  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > page;

  const paginationInfo = {
    page_number: page,
    page_size: limit,
    count: paginatedUsers.length,
    total_pages: totalPages,
    has_previous_page: hasPreviousPage,
    has_next_page: hasNextPage,
  };

  return { paginationInfo, results };
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Get list of transfers
 * @returns {Array}
 */
async function getTransfers() {
  const transfers = await usersRepository.getTransfer(); // Mengambil daftar transfer dari repository, disesuaikan dengan implementasi Anda

  const results = [];
  for (let i = 0; i < transfers.length; i += 1) {
    const transfer = transfers[i];
    results.push({
      id: transfer,
      transferId: transfer.transferId,
      fromUserId: transfer.fromUserId,
      toUserId: transfer.toUserId,
      amount: transfer.amount,
      timestamp: transfer.timestamp,
    });
  }

  return results;
}

/** create new transfer
@param {string} id - ID
@param {string} toAccNumber - Account Number
@param {string} amount - toUserId
@returns {boolean}
*/
async function createTransfer(id, toUserId, amount) {
  const transferId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  try {
    const timestamp = Date.now();
    const toUser = await usersRepository.getUser(toUserId);
    const fromUser = await usersRepository.getUser(id);

    await usersRepository.createTransfer(
      transferId,
      fromUser,
      toUser,
      amount,
      timestamp
    );

    if (!toUser) {
      return null; // Handle non-existent sender
    }

    if (!fromUser) {
      return null; // Handle non-existent sender
    }

    return true;
  } catch (err) {
    return null;
  }
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing transfer
 * @param {string} id - User ID
 * @param {string} transfer - transfer
 * @returns {boolean}
 */
async function updateTransfer(id, amount) {
  const transfer = await usersRepository.getTransfer1(id);

  // transfer not found
  if (!transfer) {
    return null;
  }

  try {
    await usersRepository.updateTransfer(id, amount);
  } catch (err) {
    return null;
  }

  return true;
}
/**
 * Delete transfer
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteTransfer(id) {
  const transfer = await usersRepository.getTransfer1(id);

  // User not found
  if (!transfer) {
    return null;
  }

  try {
    await usersRepository.deleteTransfer(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

module.exports = {
  deleteTransfer,
  updateTransfer,
  getTransfers,
  createTransfer,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
};
