const soap = require('soap');
const WSDL = 'http://localhost:4000/soap?wsdl';

async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token шаардлагатай' });
  }

  const token = header.substring(7);

  try {
    const client = await soap.createClientAsync(WSDL);
    const [result] = await client.ValidateTokenAsync({ token });

    if (result.valid === true || result.valid === 'true') {
      req.userId = result.userId;
      next();
    } else {
      res.status(401).json({ error: 'Token хүчингүй' });
    }
  } catch (err) {
    console.error('SOAP алдаа:', err.message);
    res.status(500).json({ error: 'Auth service холбогдсонгүй' });
  }
}

module.exports = authMiddleware;