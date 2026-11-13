export class AppError extends Error {
  constructor(status, message, fields = undefined) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const MYSQL_MESSAGES = {
  ER_DUP_ENTRY: [409, 'That record already exists. Check for a duplicate ID, email or registration.'],
  ER_NO_REFERENCED_ROW: [400, 'This refers to a record that does not exist (for example a department, student or section).'],
  ER_NO_REFERENCED_ROW_2: [400, 'This refers to a record that does not exist (for example a department, student or section).'],
  ER_ROW_IS_REFERENCED: [409, 'This record is still used by other records, so it cannot be changed this way.'],
  ER_ROW_IS_REFERENCED_2: [409, 'This record is still used by other records, so it cannot be changed this way.'],
  ER_CHECK_CONSTRAINT_VIOLATED: [400, 'A value is outside the allowed range for this field.'],
  ER_CONSTRAINT_FAILED: [400, 'A value is outside the allowed range for this field.'],
  ER_BAD_NULL_ERROR: [400, 'A required field is missing.'],
  ER_DATA_TOO_LONG: [400, 'A value is too long for its field.'],
  ER_TRUNCATED_WRONG_VALUE: [400, 'A value has the wrong format.'],
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: [400, 'A value has the wrong format.'],
  ER_WARN_DATA_OUT_OF_RANGE: [400, 'A number is out of range for its field.']
};

export function toHttpError(err) {
  if (err instanceof AppError) {
    return { status: err.status, body: { error: err.message, fields: err.fields } };
  }
  const known = MYSQL_MESSAGES[err.code];
  if (known) {
    const detail = err.code === 'ER_DUP_ENTRY' ? duplicateDetail(err.sqlMessage) : undefined;
    return { status: known[0], body: { error: detail || known[1], code: err.code } };
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
    return { status: 503, body: { error: 'The database is not reachable. Check that MySQL is running and that .env is set up.' } };
  }
  console.error(err);
  return { status: 500, body: { error: 'Something went wrong on the server. Please try again.' } };
}

function duplicateDetail(sqlMessage = '') {
  if (sqlMessage.includes('uq_student_email')) return 'Another student already uses that email.';
  if (sqlMessage.includes('PRIMARY') && sqlMessage.includes('student_phone')) return 'That phone number is listed twice.';
  if (sqlMessage.includes("for key 'PRIMARY'") || sqlMessage.includes('pk_') || sqlMessage.includes('.PRIMARY')) {
    return 'A record with that ID already exists.';
  }
  return undefined;
}
