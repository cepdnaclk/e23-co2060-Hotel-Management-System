const pool = require("../config/db");

async function createTrip(tripData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      user_id,
      title,
      description,
      days_count,
      travel_style,
      budget_level,
      start_city,
      travelers,
      travel_pace,
      accommodation_type,
      transport_preference,
      guide_preference,
      days = [],
      events = [],
    } = tripData;

    const [tripResult] = await connection.query(
      `INSERT INTO saved_trips
        (
          user_id,
          title,
          description,
          days_count,
          travel_style,
          budget_level,
          start_city,
          travelers,
          travel_pace,
          accommodation_type,
          transport_preference,
          guide_preference
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        title || "Saved Sri Lanka Trip",
        description || null,
        days_count,
        travel_style || null,
        budget_level || null,
        start_city || null,
        travelers || 1,
        travel_pace || null,
        accommodation_type || null,
        transport_preference || null,
        guide_preference || null,
      ]
    );

    const tripId = tripResult.insertId;

    for (const day of days) {
      const [dayResult] = await connection.query(
        `INSERT INTO trip_days
          (
            trip_id,
            day_number,
            city,
            title,
            guide_note,
            notes
          )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tripId,
          day.day_number || day.day,
          day.city,
          day.title || null,
          day.guide_note || day.guide || null,
          day.notes || null,
        ]
      );

      const tripDayId = dayResult.insertId;

      const activities = day.activities || [];

      for (const activity of activities) {
        await connection.query(
          `INSERT INTO trip_day_activities
            (
              trip_day_id,
              activity_name
            )
           VALUES (?, ?)`,
          [tripDayId, activity]
        );
      }
    }

    for (const event of events) {
      await connection.query(
        `INSERT INTO trip_events
          (
            trip_id,
            event_title,
            city,
            category,
            event_date,
            event_time,
            price
          )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tripId,
          event.title || event.event_title,
          event.city,
          event.category || null,
          event.date || event.event_date || null,
          event.time || event.event_time || null,
          event.price || 0,
        ]
      );
    }

    await connection.commit();

    return tripId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getTripsByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT
        id,
        user_id,
        title,
        description,
        days_count,
        travel_style,
        budget_level,
        start_city,
        travelers,
        travel_pace,
        accommodation_type,
        transport_preference,
        guide_preference,
        status,
        created_at,
        updated_at
     FROM saved_trips
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

async function getTripById(tripId, userId) {
  const [tripRows] = await pool.query(
    `SELECT
        id,
        user_id,
        title,
        description,
        days_count,
        travel_style,
        budget_level,
        start_city,
        travelers,
        travel_pace,
        accommodation_type,
        transport_preference,
        guide_preference,
        status,
        created_at,
        updated_at
     FROM saved_trips
     WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );

  if (tripRows.length === 0) {
    return null;
  }

  const trip = tripRows[0];

  const [dayRows] = await pool.query(
    `SELECT
        id,
        trip_id,
        day_number,
        city,
        title,
        guide_note,
        notes,
        created_at,
        updated_at
     FROM trip_days
     WHERE trip_id = ?
     ORDER BY day_number ASC`,
    [tripId]
  );

  const [activityRows] = await pool.query(
    `SELECT
        a.id,
        a.trip_day_id,
        a.activity_name
     FROM trip_day_activities a
     INNER JOIN trip_days d ON a.trip_day_id = d.id
     WHERE d.trip_id = ?
     ORDER BY a.id ASC`,
    [tripId]
  );

  const days = dayRows.map((day) => ({
    ...day,
    activities: activityRows
      .filter((activity) => activity.trip_day_id === day.id)
      .map((activity) => activity.activity_name),
  }));

  const [eventRows] = await pool.query(
    `SELECT
        id,
        trip_id,
        event_title,
        city,
        category,
        event_date,
        event_time,
        price,
        created_at
     FROM trip_events
     WHERE trip_id = ?
     ORDER BY created_at DESC`,
    [tripId]
  );

  return {
    ...trip,
    days,
    events: eventRows,
  };
}

async function deleteTrip(tripId, userId) {
  const [result] = await pool.query(
    `DELETE FROM saved_trips
     WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );

  return result.affectedRows;
}

async function addEventToTrip(tripId, userId, eventData) {
  const [tripRows] = await pool.query(
    `SELECT id FROM saved_trips
     WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );

  if (tripRows.length === 0) {
    return null;
  }

  const [result] = await pool.query(
    `INSERT INTO trip_events
      (
        trip_id,
        event_title,
        city,
        category,
        event_date,
        event_time,
        price
      )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tripId,
      eventData.title || eventData.event_title,
      eventData.city,
      eventData.category || null,
      eventData.date || eventData.event_date || null,
      eventData.time || eventData.event_time || null,
      eventData.price || 0,
    ]
  );

  return result.insertId;
}

async function removeEventFromTrip(tripId, eventId, userId) {
  const [tripRows] = await pool.query(
    `SELECT id FROM saved_trips
     WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );

  if (tripRows.length === 0) {
    return null;
  }

  const [result] = await pool.query(
    `DELETE FROM trip_events
     WHERE id = ? AND trip_id = ?`,
    [eventId, tripId]
  );

  return result.affectedRows;
}

module.exports = {
  createTrip,
  getTripsByUserId,
  getTripById,
  deleteTrip,
  addEventToTrip,
  removeEventFromTrip,
};