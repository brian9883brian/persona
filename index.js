require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración conexión MySQL con variables de entorno
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false } // Puedes eliminar esta línea si da error
};

// Función para obtener conexión a la base de datos
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Rutas CRUD

// Obtener todas las personas
app.get('/personas', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT * FROM persona');
    await conn.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener persona por ID
app.get('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT * FROM persona WHERE id = ?', [id]);
    await conn.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva persona
app.post('/personas', async (req, res) => {
  try {
    const { nombre, apellido_paterno, apellido_materno, fecha_nacimiento, IDdireccion } = req.body;
    if (!nombre || !apellido_paterno || !apellido_materno || !fecha_nacimiento) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }
    const conn = await getConnection();
    const [result] = await conn.query(
      'INSERT INTO persona (nombre, apellido_paterno, apellido_materno, fecha_nacimiento, IDdireccion) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido_paterno, apellido_materno, fecha_nacimiento, IDdireccion || null]
    );
    await conn.end();
    res.status(201).json({ message: 'Persona creada', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar persona por ID
app.put('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno, fecha_nacimiento, IDdireccion } = req.body;
    const conn = await getConnection();

    // Verificar que la persona existe
    const [rows] = await conn.query('SELECT * FROM persona WHERE id = ?', [id]);
    if (rows.length === 0) {
      await conn.end();
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    const persona = rows[0];

    const updatedNombre = nombre || persona.nombre;
    const updatedApPaterno = apellido_paterno || persona.apellido_paterno;
    const updatedApMaterno = apellido_materno || persona.apellido_materno;
    const updatedFechaNac = fecha_nacimiento || persona.fecha_nacimiento;
    const updatedIDdireccion = IDdireccion !== undefined ? IDdireccion : persona.IDdireccion;

    await conn.query(
      'UPDATE persona SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, fecha_nacimiento = ?, IDdireccion = ? WHERE id = ?',
      [updatedNombre, updatedApPaterno, updatedApMaterno, updatedFechaNac, updatedIDdireccion, id]
    );

    await conn.end();
    res.json({ message: 'Persona actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar persona por ID
app.delete('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getConnection();
    const [result] = await conn.query('DELETE FROM persona WHERE id = ?', [id]);
    await conn.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    res.json({ message: 'Persona eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Microservicio persona corriendo en http://localhost:${PORT}`);
});
