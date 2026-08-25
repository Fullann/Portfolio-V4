const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');


exports.getAllTestimonials = catchAsync(async (req, res, next) => {
  const testimonials = await dbOperations.testimonials.getAll();
  res.json(testimonials);
});

exports.createTestimonial = catchAsync(async (req, res, next) => {
  const { name, text, date } = req.body;
  const avatar = req.file 
    ? `/assets/images/${req.file.filename}` 
    : '/assets/images/avatar-default.png';


  const newTestimonial = await dbOperations.testimonials.create({
    name,
    text,
    avatar,
    date: date || new Date().toISOString().split('T')[0]
  });

  await updateHtmlFile();
  res.json(newTestimonial);
});

exports.updateTestimonial = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, text, date } = req.body;


  const updateData = { name, text, date };
  if (req.file) {
    updateData.avatar = `/assets/images/${req.file.filename}`;
  }

  const updatedTestimonial = await dbOperations.testimonials.update(id, updateData);
  if (!updatedTestimonial) {
    return next(new AppError('Témoignage non trouvé', 404));
  }

  await updateHtmlFile();
  res.json(updatedTestimonial);
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await dbOperations.testimonials.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
