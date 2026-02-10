const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllClients = async (req, res) => {
  try {
    const clients = await dbOperations.clients.getAll();
    res.json(clients);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des clients' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, website, description } = req.body;
    const logo = req.file ? `/assets/images/${req.file.filename}` : null;

    lastUpdate = Date.now();

    const newClient = await dbOperations.clients.create({
      name,
      logo,
      website: website || '',
      description: description || ''
    });

    await updateHtmlFile();
    res.json(newClient);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du client' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, description } = req.body;

    lastUpdate = Date.now();

    const updateData = { name, website, description };
    if (req.file) {
      updateData.logo = `/assets/images/${req.file.filename}`;
    }

    const updatedClient = await dbOperations.clients.update(id, updateData);
    if (!updatedClient) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    await updateHtmlFile();
    res.json(updatedClient);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du client' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.clients.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
};
