const tripsModel = require("../models/trips.model");

async function createTrip(req, res) {
  try {
    const tripData = req.body;

    if (!tripData.user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    if (!tripData.days_count) {
      return res.status(400).json({
        success: false,
        message: "days_count is required",
      });
    }

    const tripId = await tripsModel.createTrip(tripData);

    const savedTrip = await tripsModel.getTripById(tripId, tripData.user_id);

    return res.status(201).json({
      success: true,
      message: "Trip saved successfully",
      data: savedTrip,
    });
  } catch (error) {
    console.error("Create trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save trip",
      error: error.message,
    });
  }
}

async function getMyTrips(req, res) {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query parameter is required",
      });
    }

    const trips = await tripsModel.getTripsByUserId(userId);

    return res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("Get my trips error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get trips",
      error: error.message,
    });
  }
}

async function getTripDetails(req, res) {
  try {
    const { id } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query parameter is required",
      });
    }

    const trip = await tripsModel.getTripById(id, userId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Get trip details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get trip details",
      error: error.message,
    });
  }
}

async function deleteTrip(req, res) {
  try {
    const { id } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query parameter is required",
      });
    }

    const affectedRows = await tripsModel.deleteTrip(id, userId);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or already deleted",
      });
    }

    return res.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete trip",
      error: error.message,
    });
  }
}

async function addEventToTrip(req, res) {
  try {
    const { id } = req.params;
    const { user_id, event } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    if (!event) {
      return res.status(400).json({
        success: false,
        message: "event object is required",
      });
    }

    const eventId = await tripsModel.addEventToTrip(id, user_id, event);

    if (!eventId) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const updatedTrip = await tripsModel.getTripById(id, user_id);

    return res.status(201).json({
      success: true,
      message: "Event added to trip successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("Add event to trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add event to trip",
      error: error.message,
    });
  }
}

async function removeEventFromTrip(req, res) {
  try {
    const { id, eventId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query parameter is required",
      });
    }

    const affectedRows = await tripsModel.removeEventFromTrip(id, eventId, userId);

    if (affectedRows === null) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found in this trip",
      });
    }

    return res.json({
      success: true,
      message: "Event removed from trip successfully",
    });
  } catch (error) {
    console.error("Remove event from trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove event from trip",
      error: error.message,
    });
  }
}

module.exports = {
  createTrip,
  getMyTrips,
  getTripDetails,
  deleteTrip,
  addEventToTrip,
  removeEventFromTrip,
};