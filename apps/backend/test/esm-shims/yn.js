// Mock for yn module
module.exports = function yn(input) {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const normalized = input.toLowerCase().trim();
    if (
      normalized === 'true' ||
      normalized === 'yes' ||
      normalized === 'y' ||
      normalized === '1'
    )
      return true;
    if (
      normalized === 'false' ||
      normalized === 'no' ||
      normalized === 'n' ||
      normalized === '0'
    )
      return false;
  }
  if (typeof input === 'number') {
    return input === 1;
  }
  return undefined;
};

module.exports.default = module.exports;
