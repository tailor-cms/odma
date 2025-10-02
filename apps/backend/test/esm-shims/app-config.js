// Mock for @app/config package
module.exports = {
  resolveOrigin: function (url) {
    // Simple mock implementation for resolveOrigin
    if (!url) return 'http://localhost:3000';
    return url;
  },
};