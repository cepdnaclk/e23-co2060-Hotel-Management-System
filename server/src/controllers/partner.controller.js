const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const buildUploadUrl = (req) =>
  `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

const validateStrongPassword = (password) => {
  const value = String(password || "");

  const hasMinLength = value.length >= 8;
  const hasCapital = /[A-Z]/.test(value);
  const hasSimple = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (hasMinLength && hasCapital && hasSimple && hasNumber && hasSymbol) {
    return "";
  }

  return "Property password must be at least 8 characters and contain a capital letter, simple letter, number, and symbol.";
};

const DEFAULT_PLANS = {
  standard: {
    plan_key: "standard",
    plan_name: "Normal Version",
    room_limit: 50,
    registration_fee: 5000,
    monthly_fee: 2500,
  },
  premium: {
    plan_key: "premium",
    plan_name: "Premium Version",
    room_limit: 100,
    registration_fee: 8500,
    monthly_fee: 4000,
  },
};

const getPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(
      `SELECT 
        plan_key,
        plan_name,
        room_limit,
        registration_fee,
        monthly_fee,
        description,
        is_active
       FROM property_plans
       WHERE is_active = TRUE
       ORDER BY room_limit ASC, monthly_fee ASC`
    );

    if (plans.length === 0) {
      return res.status(200).json({
        success: true,
        data: Object.values(DEFAULT_PLANS),
      });
    }

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);

    return res.status(200).json({
      success: true,
      data: Object.values(DEFAULT_PLANS),
    });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    return res.status(200).json({
      success: true,
      image_url: buildUploadUrl(req),
    });
  } catch (error) {
    console.error("Upload image error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading image",
    });
  }
};

const getPartnerProfile = async (req, res) => {
  try {
    const [partners] = await pool.query(
      `SELECT id, full_name, email, phone, role, created_at 
       FROM users 
       WHERE id = ? AND role = 'partner'`,
      [req.user.id]
    );

    if (partners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Partner profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: partners[0],
    });
  } catch (error) {
    console.error("Get partner profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting partner profile",
    });
  }
};

const getMyProperties = async (req, res) => {
  try {
    const [properties] = await pool.query(
      `SELECT 
        p.*,
        COALESCE(SUM(r.total_rooms), 0) AS total_rooms_count,
        COUNT(DISTINCT r.id) AS room_type_count,
        pp.image_url AS main_image
       FROM properties p
       LEFT JOIN rooms r ON p.id = r.property_id
       LEFT JOIN property_photos pp ON p.id = pp.property_id AND pp.is_main = TRUE
       WHERE p.partner_id = ?
       GROUP BY p.id, pp.image_url
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Get my properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting partner properties",
    });
  }
};

const getMyPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.query(
      `SELECT 
        p.*,
        COALESCE(SUM(r.total_rooms), 0) AS total_rooms_count
       FROM properties p
       LEFT JOIN rooms r ON p.id = r.property_id
       WHERE p.id = ? AND p.partner_id = ?
       GROUP BY p.id`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    const [rooms] = await pool.query(
      `SELECT 
        r.*,
        rp.image_url AS main_image
       FROM rooms r
       LEFT JOIN room_photos rp ON r.id = rp.room_id AND rp.is_main = TRUE
       WHERE r.property_id = ?
       ORDER BY r.id ASC`,
      [id]
    );

    const [photos] = await pool.query(
      `SELECT *
       FROM property_photos
       WHERE property_id = ?
       ORDER BY is_main DESC, id ASC`,
      [id]
    );

    const [policies] = await pool.query(
      `SELECT *
       FROM property_policies
       WHERE property_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...properties[0],
        rooms,
        photos,
        policies: policies[0] || null,
      },
    });
  } catch (error) {
    console.error("Get my property by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting property details",
    });
  }
};

const createProperty = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      city,
      district,
      address,
      description,
      quote,
      logo_url,
      hero_title,
      theme_color,
      property_type,
      property_password,
      plan_type,
      rooms,
      photos,
      policies,
    } = req.body;

    if (!name || !city || !address || !description || !property_type) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Property name, city, address, description, and type are required",
      });
    }

    const propertyPasswordError = validateStrongPassword(property_password);

    if (propertyPasswordError) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: propertyPasswordError,
      });
    }

    const [activePlans] = await connection.query(
      `SELECT *
       FROM property_plans
       WHERE is_active = TRUE
       ORDER BY room_limit ASC, monthly_fee ASC`
    );

    const selectedPlan =
      activePlans.find((plan) => plan.plan_key === plan_type) ||
      activePlans[0] ||
      DEFAULT_PLANS[plan_type] ||
      DEFAULT_PLANS.standard;

    const totalRooms = Array.isArray(rooms)
      ? rooms.reduce((sum, room) => sum + Number(room.total_rooms || 0), 0)
      : 0;

    if (totalRooms > Number(selectedPlan.room_limit)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `${selectedPlan.plan_name} allows maximum ${selectedPlan.room_limit} rooms`,
      });
    }

    const passwordHash = await bcrypt.hash(property_password, 10);

    const [propertyResult] = await connection.query(
      `INSERT INTO properties
       (
        partner_id,
        name,
        city,
        district,
        address,
        description,
        quote,
        logo_url,
        hero_title,
        theme_color,
        property_type,
        property_password_hash,
        status,
        is_verified,
        plan_type,
        room_limit,
        registration_fee,
        platform_registration_fee,
        registration_payment_status,
        fee_payment_status,
        monthly_charge,
        monthly_payment_status,
        monthly_cycle_start,
        monthly_cycle_end,
        next_monthly_due_date
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', FALSE, ?, ?, ?, ?, 'Unpaid', 'Unpaid', ?, 'Free Trial', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
      [
        req.user.id,
        name,
        city,
        district || null,
        address,
        description,
        quote || null,
        logo_url || null,
        hero_title || name,
        theme_color || "#0f7a43",
        property_type,
        passwordHash,
        selectedPlan.plan_key,
        selectedPlan.room_limit,
        selectedPlan.registration_fee,
        selectedPlan.registration_fee,
        selectedPlan.monthly_fee,
      ]
    );

    const propertyId = propertyResult.insertId;
    const createdRooms = [];

    if (Array.isArray(rooms)) {
      for (let i = 0; i < rooms.length; i += 1) {
        const room = rooms[i];

        const [roomResult] = await connection.query(
          `INSERT INTO rooms
           (
            property_id,
            room_type,
            capacity,
            base_occupancy,
            price_per_night,
            extra_person_price,
            price_per_day,
            total_rooms,
            available_rooms
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            propertyId,
            room.room_type,
            Number(room.capacity),
            Number(room.base_occupancy || 1),
            Number(room.price_per_night),
            Number(room.extra_person_price || 0),
            room.price_per_day ? Number(room.price_per_day) : null,
            Number(room.total_rooms),
            Number(room.total_rooms),
          ]
        );

        if (room.image_url) {
          await connection.query(
            `INSERT INTO room_photos (room_id, image_url, is_main)
             VALUES (?, ?, TRUE)`,
            [roomResult.insertId, room.image_url]
          );
        }

        createdRooms.push({
          index: i,
          room_id: roomResult.insertId,
        });
      }
    }

    if (Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];

        if (photo.image_url) {
          await connection.query(
            `INSERT INTO property_photos (property_id, image_url, is_main)
             VALUES (?, ?, ?)`,
            [propertyId, photo.image_url, Boolean(photo.is_main)]
          );
        }
      }
    }

    if (policies) {
      await connection.query(
        `INSERT INTO property_policies
         (
          property_id,
          check_in_time,
          check_out_time,
          cancellation_policy,
          day_package_available,
          night_package_available
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          propertyId,
          policies.check_in_time || "14:00:00",
          policies.check_out_time || "11:00:00",
          policies.cancellation_policy || "Cancellation policy not provided.",
          policies.day_package_available === false ? false : true,
          policies.night_package_available === false ? false : true,
        ]
      );
    }

    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        req.user.id,
        "Property registration submitted",
        `${name} was submitted successfully. Admin approval is required before tourists can see it.`,
        "property",
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Property registered successfully",
      property_id: propertyId,
      rooms: createdRooms,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create property error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating property",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const verifyPropertyPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { property_password } = req.body;

    if (!property_password) {
      return res.status(400).json({
        success: false,
        message: "Property password is required",
      });
    }

    const [properties] = await pool.query(
      `SELECT id, property_password_hash
       FROM properties
       WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    const isMatch = await bcrypt.compare(
      property_password,
      properties[0].property_password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid property password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property password verified",
    });
  } catch (error) {
    console.error("Verify property password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while verifying property password",
    });
  }
};

const updateMyProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      city,
      district,
      address,
      description,
      quote,
      logo_url,
      hero_title,
      theme_color,
      property_type,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE properties
       SET name = ?,
           city = ?,
           district = ?,
           address = ?,
           description = ?,
           quote = ?,
           logo_url = ?,
           hero_title = ?,
           theme_color = ?,
           property_type = ?
       WHERE id = ? AND partner_id = ?`,
      [
        name,
        city,
        district || null,
        address,
        description,
        quote || null,
        logo_url || null,
        hero_title || name,
        theme_color || "#0f7a43",
        property_type,
        id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Update property error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating property",
    });
  }
};

const updateMainPropertyPhoto = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { image_url } = req.body;

    if (!image_url) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const [properties] = await connection.query(
      `SELECT id FROM properties WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    await connection.query(
      `UPDATE property_photos
       SET is_main = FALSE
       WHERE property_id = ?`,
      [id]
    );

    await connection.query(
      `INSERT INTO property_photos (property_id, image_url, is_main)
       VALUES (?, ?, TRUE)`,
      [id, image_url]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Main property photo updated successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update main property photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating main property photo",
    });
  } finally {
    connection.release();
  }
};

const uploadMainPropertyPhoto = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    if (!req.file) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const [properties] = await connection.query(
      `SELECT id FROM properties WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    const imageUrl = buildUploadUrl(req);

    await connection.query(
      `UPDATE property_photos SET is_main = FALSE WHERE property_id = ?`,
      [id]
    );

    await connection.query(
      `INSERT INTO property_photos (property_id, image_url, is_main)
       VALUES (?, ?, TRUE)`,
      [id, imageUrl]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Main photo uploaded successfully",
      image_url: imageUrl,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Upload main property photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading main property photo",
    });
  } finally {
    connection.release();
  }
};

const uploadLogoPropertyPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Logo image file is required",
      });
    }

    const imageUrl = buildUploadUrl(req);

    const [result] = await pool.query(
      `UPDATE properties SET logo_url = ? WHERE id = ? AND partner_id = ?`,
      [imageUrl, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      logo_url: imageUrl,
    });
  } catch (error) {
    console.error("Upload logo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading logo",
    });
  }
};

const uploadIntroPropertyPhoto = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const slot = Number(req.body.slot || 0);

    if (!req.file) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Intro image file is required",
      });
    }

    const [properties] = await connection.query(
      `SELECT id FROM properties WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    const imageUrl = buildUploadUrl(req);

    if (slot === 1 || slot === 2) {
      const [introPhotos] = await connection.query(
        `SELECT id
         FROM property_photos
         WHERE property_id = ? AND is_main = FALSE
         ORDER BY id ASC`,
        [id]
      );

      const existingPhoto = introPhotos[slot - 1];

      if (existingPhoto) {
        await connection.query(
          `UPDATE property_photos
           SET image_url = ?
           WHERE id = ? AND property_id = ?`,
          [imageUrl, existingPhoto.id, id]
        );
      } else {
        await connection.query(
          `INSERT INTO property_photos (property_id, image_url, is_main)
           VALUES (?, ?, FALSE)`,
          [id, imageUrl]
        );
      }
    } else {
      await connection.query(
        `INSERT INTO property_photos (property_id, image_url, is_main)
         VALUES (?, ?, FALSE)`,
        [id, imageUrl]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: slot
        ? `Intro photo ${slot} uploaded successfully`
        : "Property photo uploaded successfully",
      image_url: imageUrl,
      slot: slot || null,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Upload intro property photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading property photo",
    });
  } finally {
    connection.release();
  }
};

const addRoomToMyProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      room_type,
      capacity,
      base_occupancy,
      price_per_night,
      extra_person_price,
      price_per_day,
      total_rooms,
      image_url,
    } = req.body;

    const maxGuests = Number(capacity || 0);
    const baseGuests = Number(base_occupancy || 1);
    const basePrice = Number(price_per_night || 0);
    const extraPrice = Number(extra_person_price || 0);
    const totalRooms = Number(total_rooms || 0);

    if (!room_type || maxGuests < 1 || basePrice <= 0 || totalRooms < 1) {
      return res.status(400).json({
        success: false,
        message: "Room type, capacity, price, and total rooms are required",
      });
    }

    if (baseGuests < 1 || baseGuests > maxGuests) {
      return res.status(400).json({
        success: false,
        message: "Base guests included must be between 1 and maximum guests",
      });
    }

    const [properties] = await pool.query(
      `SELECT 
        p.id,
        p.room_limit,
        COALESCE(SUM(r.total_rooms), 0) AS current_rooms
       FROM properties p
       LEFT JOIN rooms r ON p.id = r.property_id
       WHERE p.id = ? AND p.partner_id = ?
       GROUP BY p.id`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    const property = properties[0];

    if (Number(property.current_rooms) + totalRooms > Number(property.room_limit)) {
      return res.status(400).json({
        success: false,
        message: `Room limit exceeded. Current: ${property.current_rooms}, limit: ${property.room_limit}`,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO rooms
       (
        property_id,
        room_type,
        capacity,
        base_occupancy,
        price_per_night,
        extra_person_price,
        price_per_day,
        total_rooms,
        available_rooms
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        room_type,
        maxGuests,
        baseGuests,
        basePrice,
        extraPrice,
        price_per_day ? Number(price_per_day) : null,
        totalRooms,
        totalRooms,
      ]
    );

    if (image_url) {
      await pool.query(
        `INSERT INTO room_photos (room_id, image_url, is_main)
         VALUES (?, ?, TRUE)`,
        [result.insertId, image_url]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Room added successfully",
      room_id: result.insertId,
    });
  } catch (error) {
    console.error("Add room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding room",
    });
  }
};

const updateMyRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const {
      room_type,
      capacity,
      base_occupancy,
      price_per_night,
      extra_person_price,
      price_per_day,
      total_rooms,
      available_rooms,
    } = req.body;

    const [rooms] = await pool.query(
      `SELECT 
        r.id,
        r.property_id,
        p.partner_id
       FROM rooms r
       INNER JOIN properties p ON r.property_id = p.id
       WHERE r.id = ? AND p.partner_id = ?`,
      [roomId, req.user.id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room not found or you do not own this room",
      });
    }

    await pool.query(
      `UPDATE rooms
       SET room_type = ?,
           capacity = ?,
           base_occupancy = ?,
           price_per_night = ?,
           extra_person_price = ?,
           price_per_day = ?,
           total_rooms = ?,
           available_rooms = ?
       WHERE id = ?`,
      [
        room_type,
        Number(capacity),
        Number(base_occupancy || 1),
        Number(price_per_night),
        Number(extra_person_price || 0),
        price_per_day ? Number(price_per_day) : null,
        Number(total_rooms),
        Number(available_rooms),
        roomId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
    });
  } catch (error) {
    console.error("Update room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating room",
    });
  }
};

const uploadRoomPhoto = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { roomId } = req.params;

    if (!req.file) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Room image file is required",
      });
    }

    const [rooms] = await connection.query(
      `SELECT 
        r.id,
        r.property_id,
        p.partner_id
       FROM rooms r
       INNER JOIN properties p ON r.property_id = p.id
       WHERE r.id = ? AND p.partner_id = ?`,
      [roomId, req.user.id]
    );

    if (rooms.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Room not found or you do not own this room",
      });
    }

    const imageUrl = buildUploadUrl(req);

    await connection.query(
      `UPDATE room_photos SET is_main = FALSE WHERE room_id = ?`,
      [roomId]
    );

    await connection.query(
      `INSERT INTO room_photos (room_id, image_url, is_main)
       VALUES (?, ?, TRUE)`,
      [roomId, imageUrl]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Room photo uploaded successfully",
      image_url: imageUrl,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Upload room photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading room photo",
    });
  } finally {
    connection.release();
  }
};

const payRegistrationFee = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [properties] = await connection.query(
      `SELECT id, partner_id, plan_type, registration_fee
       FROM properties
       WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    await connection.query(
      `UPDATE properties
       SET registration_payment_status = 'Paid',
           fee_payment_status = 'Paid',
           registration_paid_at = NOW()
       WHERE id = ?`,
      [id]
    );

    try {
      await connection.query(
        `INSERT INTO payment_transactions
         (property_id, partner_id, payment_type, plan_type, amount, status, paid_at, notes)
         VALUES (?, ?, 'registration', ?, ?, 'Paid', NOW(), ?)`,
        [
          id,
          properties[0].partner_id,
          properties[0].plan_type,
          Number(properties[0].registration_fee || 0),
          "Partner paid registration fee",
        ]
      );
    } catch {
      // Keeps old DB safe if payment_transactions table was not created yet.
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Registration fee paid successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Pay registration fee error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while paying registration fee",
    });
  } finally {
    connection.release();
  }
};

const payMonthlyFee = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [properties] = await connection.query(
      `SELECT id, partner_id, plan_type, monthly_charge
       FROM properties
       WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    await connection.query(
      `UPDATE properties
       SET monthly_payment_status = 'Paid',
           monthly_paid_at = NOW(),
           monthly_cycle_start = NOW(),
           monthly_cycle_end = DATE_ADD(NOW(), INTERVAL 1 MONTH),
           next_monthly_due_date = DATE_ADD(NOW(), INTERVAL 1 MONTH)
       WHERE id = ?`,
      [id]
    );

    try {
      await connection.query(
        `INSERT INTO payment_transactions
         (property_id, partner_id, payment_type, plan_type, amount, status, paid_at, notes)
         VALUES (?, ?, 'monthly', ?, ?, 'Paid', NOW(), ?)`,
        [
          id,
          properties[0].partner_id,
          properties[0].plan_type,
          Number(properties[0].monthly_charge || 0),
          "Partner paid monthly fee",
        ]
      );
    } catch {
      // Keeps old DB safe if payment_transactions table was not created yet.
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Monthly fee paid successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Pay monthly fee error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while paying monthly fee",
    });
  } finally {
    connection.release();
  }
};

const changePropertyPlan = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { plan_type } = req.body;

    const [plans] = await connection.query(
      `SELECT *
       FROM property_plans
       WHERE is_active = TRUE
       ORDER BY room_limit ASC, monthly_fee ASC`
    );

    const selectedPlan =
      plans.find((plan) => plan.plan_key === plan_type) ||
      DEFAULT_PLANS[plan_type];

    if (!selectedPlan) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Selected version is not active or does not exist",
      });
    }

    const [properties] = await connection.query(
      `SELECT 
        p.id,
        p.partner_id,
        p.plan_type,
        COALESCE(SUM(r.total_rooms), 0) AS total_rooms
       FROM properties p
       LEFT JOIN rooms r ON p.id = r.property_id
       WHERE p.id = ? AND p.partner_id = ?
       GROUP BY p.id`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    if (Number(properties[0].total_rooms) > Number(selectedPlan.room_limit)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `${selectedPlan.plan_name} allows maximum ${selectedPlan.room_limit} rooms. Your property has ${properties[0].total_rooms} rooms.`,
      });
    }

    await connection.query(
      `UPDATE properties
       SET plan_type = ?,
           room_limit = ?,
           registration_fee = ?,
           platform_registration_fee = ?,
           monthly_charge = ?,
           monthly_payment_status = 'Unpaid',
           monthly_paid_at = NULL,
           monthly_cycle_start = NOW(),
           monthly_cycle_end = DATE_ADD(NOW(), INTERVAL 1 MONTH),
           next_monthly_due_date = NOW()
       WHERE id = ?`,
      [
        selectedPlan.plan_key,
        selectedPlan.room_limit,
        selectedPlan.registration_fee,
        selectedPlan.registration_fee,
        selectedPlan.monthly_fee,
        id,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Property version changed successfully. Monthly started date reset from today.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Change property plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while changing property version",
    });
  } finally {
    connection.release();
  }
};

const deleteMyRoom = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { roomId } = req.params;

    const [rooms] = await connection.query(
      `SELECT r.id
       FROM rooms r
       INNER JOIN properties p ON r.property_id = p.id
       WHERE r.id = ? AND p.partner_id = ?`,
      [roomId, req.user.id]
    );

    if (rooms.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Room not found or you do not own this room",
      });
    }

    await connection.query(`DELETE FROM room_photos WHERE room_id = ?`, [roomId]);
    await connection.query(`DELETE FROM rooms WHERE id = ?`, [roomId]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Room removed successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting room",
    });
  } finally {
    connection.release();
  }
};

const deleteMyProperty = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [properties] = await connection.query(
      `SELECT id
       FROM properties
       WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (properties.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property",
      });
    }

    await connection.query(
      `DELETE FROM room_photos WHERE room_id IN (SELECT id FROM rooms WHERE property_id = ?)`,
      [id]
    );

    await connection.query(`DELETE FROM property_photos WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM property_policies WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM bookings WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM rooms WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM properties WHERE id = ?`, [id]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Property removed successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete property error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting property",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getPlans,
  uploadImage,
  getPartnerProfile,
  getMyProperties,
  getMyPropertyById,
  createProperty,
  verifyPropertyPassword,
  updateMyProperty,
  updateMainPropertyPhoto,
  uploadMainPropertyPhoto,
  uploadLogoPropertyPhoto,
  uploadIntroPropertyPhoto,
  addRoomToMyProperty,
  updateMyRoom,
  uploadRoomPhoto,
  payRegistrationFee,
  payMonthlyFee,
  changePropertyPlan,
  deleteMyRoom,
  deleteMyProperty,
};
