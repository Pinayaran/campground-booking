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

//Revoke a token from its decoded payload. Stored until the token's own expiry;
//upsert so revoking the same token twice is harmless.
RevokedTokenSchema.statics.revoke = function ({ jti, exp }) {
  return this.updateOne(
    { jti },
    { jti, expiresAt: new Date(exp * 1000) },
    { upsert: true }
  );
};

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);
