const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await dbOperations.testimonials.getAll();
    res.json(testimonials);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des témoignages' });
  }
};

exports.createTestimonial = async (req, res) => {
  try {
    const { name, text, date } = req.body;
    const avatar = req.file 
      ? `/assets/images/${req.file.filename}` 
      : '/assets/images/avatar-default.png';

    lastUpdate = Date.now();

    const newTestimonial = await dbOperations.testimonials.create({
      name,
      text,
      avatar,
      date: date || new Date().toISOString().split('T')[0]
    });

    await updateHtmlFile();
    res.json(newTestimonial);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du témoignage' });
  }
};

exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, text, date } = req.body;

    lastUpdate = Date.now();

    const updateData = { name, text, date };
    if (req.file) {
      updateData.avatar = `/assets/images/${req.file.filename}`;
    }

    const updatedTestimonial = await dbOperations.testimonials.update(id, updateData);
    if (!updatedTestimonial) {
      return res.status(404).json({ error: 'Témoignage non trouvé' });
    }

    await updateHtmlFile();
    res.json(updatedTestimonial);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du témoignage' });
  }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.testimonials.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du témoignage' });
  }
};
