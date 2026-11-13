const mongoose = require('mongoose');

//JWTs revoked by logout. A token is identified by its jti claim.
//Each entry is removed automatically by MongoDB once the token would have expired anyway.
const RevokedTokenSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

//TTL index: delete the document when expiresAt is reached
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);
