const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "TourismHub API running",
  });
};

module.exports = {
  healthCheck,
};