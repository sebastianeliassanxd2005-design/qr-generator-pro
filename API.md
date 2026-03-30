# QR Generator Pro - API Documentation

## 🚀 Overview

La API de QR Generator Pro te permite generar códigos QR programáticamente desde tus aplicaciones.

---

## 📍 Base URL

```
Production: https://qr-generator-pro-green.vercel.app/api
Local: http://localhost:3000/api
```

---

## 🔑 Authentication

Actualmente **NO se requiere autenticación** (free tier).

En el futuro se implementará un sistema de API keys para el plan premium.

---

## 📊 Rate Limits

| Plan | Requests/minuto | Requests/día |
|------|-----------------|--------------|
| **Free** | 100 | 10,000 |
| **Premium** | 1000 | 100,000 |

---

## 📡 Endpoints

### 1. **GET /api/info**

Obtener información de la API.

**Request:**
```bash
GET /api/info
```

**Response:**
```json
{
  "name": "QR Generator Pro API",
  "version": "1.0.0",
  "description": "Generate QR codes programmatically",
  "endpoints": { ... },
  "limits": { ... }
}
```

---

### 2. **GET /api/generate**

Generar un código QR con opciones básicas.

**Request:**
```bash
GET /api/generate?data=https://example.com&size=512&color=%23000000
```

**Parámetros:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `data` | string | ✅ Sí | - | Datos a codificar (URL, texto, email, etc.) |
| `size` | number | ❌ No | 512 | Tamaño en píxeles (256-1024) |
| `color` | string | ❌ No | #000000 | Color del QR (hex) |
| `bgColor` | string | ❌ No | #ffffff | Color de fondo (hex) |

**Response:**
```json
{
  "success": true,
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "size": 512
}
```

---

### 3. **POST /api/generate**

Generar un código QR con opciones avanzadas.

**Request:**
```bash
POST /api/generate
Content-Type: application/json

{
  "data": "https://example.com",
  "options": {
    "size": 512,
    "color": "#667eea",
    "bgColor": "#ffffff",
    "errorCorrection": "M"
  }
}
```

**Body Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `data` | string | ✅ Sí | Datos a codificar |
| `options` | object | ❌ No | Opciones avanzadas |
| `options.size` | number | ❌ No | Tamaño (256-1024) |
| `options.color` | string | ❌ No | Color del QR |
| `options.bgColor` | string | ❌ No | Color de fondo |
| `options.errorCorrection` | string | ❌ No | Nivel de corrección (L, M, Q, H) |

**Response:**
```json
{
  "success": true,
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "size": 512
}
```

---

### 4. **GET /api/docs**

Obtener documentación completa de la API.

**Request:**
```bash
GET /api/docs
```

**Response:**
```json
{
  "documentation": {
    "title": "QR Generator Pro API Documentation",
    "version": "1.0.0",
    "endpoints": [ ... ],
    "examples": { ... }
  }
}
```

---

## 💻 Ejemplos de Uso

### JavaScript (Fetch)

```javascript
// GET request
const response = await fetch(
  'https://qr-generator-pro-green.vercel.app/api/generate?data=https://example.com'
);
const qr = await response.json();
console.log(qr.data); // Base64 image

// POST request
const response = await fetch(
  'https://qr-generator-pro-green.vercel.app/api/generate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: 'https://example.com',
      options: {
        size: 512,
        color: '#667eea',
        bgColor: '#ffffff'
      }
    })
  }
);
const qr = await response.json();
console.log(qr.data);
```

### Python (Requests)

```python
import requests

# GET request
response = requests.get(
    'https://qr-generator-pro-green.vercel.app/api/generate',
    params={'data': 'https://example.com', 'size': 512}
)
qr = response.json()
print(qr['data'])

# POST request
response = requests.post(
    'https://qr-generator-pro-green.vercel.app/api/generate',
    json={
        'data': 'https://example.com',
        'options': {
            'size': 512,
            'color': '#667eea',
            'bgColor': '#ffffff'
        }
    }
)
qr = response.json()
print(qr['data'])
```

### cURL

```bash
# GET request
curl "https://qr-generator-pro-green.vercel.app/api/generate?data=https://example.com&size=512"

# POST request
curl -X POST "https://qr-generator-pro-green.vercel.app/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://example.com",
    "options": {
      "size": 512,
      "color": "#667eea",
      "bgColor": "#ffffff"
    }
  }'
```

### PHP (cURL)

```php
<?php
$data = [
    'data' => 'https://example.com',
    'options' => [
        'size' => 512,
        'color' => '#667eea',
        'bgColor' => '#ffffff'
    ]
];

$ch = curl_init('https://qr-generator-pro-green.vercel.app/api/generate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$qr = json_decode($response, true);

echo $qr['data'];
?>
```

---

## ❌ Error Codes

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `400` | Bad Request | Faltan parámetros requeridos |
| `429` | Too Many Requests | Límite de rate excedido |
| `500` | Internal Server Error | Error al generar el QR |

**Error Response:**
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## 🎯 Casos de Uso

### 1. Generar QR para URL

```javascript
const qr = await fetch('/api/generate?data=https://mi-sitio.com');
```

### 2. Generar QR para WiFi

```javascript
const wifiData = 'WIFI:T:WPA;S:MiRed;P:MiPassword;;';
const qr = await fetch(`/api/generate?data=${encodeURIComponent(wifiData)}`);
```

### 3. Generar QR para Email

```javascript
const emailData = 'mailto:ejemplo@correo.com?subject=Hola&body=Mensaje';
const qr = await fetch(`/api/generate?data=${encodeURIComponent(emailData)}`);
```

### 4. Generar QR para Teléfono

```javascript
const phoneData = 'tel:+1234567890';
const qr = await fetch(`/api/generate?data=${encodeURIComponent(phoneData)}`);
```

---

## 🚀 Deploy Local

### Instalar dependencias:

```bash
npm install
```

### Iniciar servidor:

```bash
npm start
```

### Modo desarrollo (auto-reload):

```bash
npm run dev
```

El servidor correrá en: `http://localhost:3000`

---

## 📞 Soporte

¿Tienes preguntas o problemas?

- 📧 Email: soporte@qr-generator-pro.com
- 🐛 Issues: https://github.com/sebastianeliassanxd2005-design/qr-generator-pro/issues
- 📚 Docs: https://qr-generator-pro-green.vercel.app/docs.html

---

## 📄 License

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

**¡Happy Coding!** 🎉
