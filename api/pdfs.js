const { prisma } = require('./db');
const { authMiddleware, roleMiddleware } = require('./middleware');

async function handler(req, res) {
  // Apply auth middleware
  authMiddleware(req, res, () => {
    const { method } = req;

    if (method === 'GET') {
      // All authenticated users can view PDFs
      return getPdfs(req, res);
    }

    if (method === 'POST') {
      // Only admin and above can upload
      roleMiddleware(['admin', 'super_admin', 'root'])(req, res, () => postPdf(req, res));
    } else if (method === 'PUT') {
      // Only admin and above can modify
      roleMiddleware(['admin', 'super_admin', 'root'])(req, res, () => putPdf(req, res));
    } else if (method === 'DELETE') {
      // Only super_admin can delete
      roleMiddleware(['super_admin'])(req, res, () => deletePdf(req, res));
    } else {
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      res.status(405).end('Method not allowed');
    }
  });
}

async function getPdfs(req, res) {
  try {
    const pdfs = await prisma.pdf.findMany({
      include: { uploadedBy: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ pdfs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
}

async function postPdf(req, res) {
  const { name, fileUrl } = req.body;
  if (!name || !fileUrl) {
    return res.status(400).json({ error: 'name and fileUrl required' });
  }

  try {
    const pdf = await prisma.pdf.create({
      data: {
        name,
        fileUrl,
        uploadedById: req.user.userId
      }
    });
    res.status(201).json({ pdf });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PDF' });
  }
}

async function putPdf(req, res) {
  const { id } = req.query;
  const { name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'id and name required' });
  }

  try {
    const pdf = await prisma.pdf.update({
      where: { id: Number(id) },
      data: { name }
    });
    res.status(200).json({ pdf });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update PDF' });
  }
}

async function deletePdf(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'id required' });
  }

  try {
    await prisma.pdf.delete({ where: { id: Number(id) } });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
}

module.exports = handler;
