require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");

const app = express();
const port = Number(process.env.PORT || 3000);
const resolveBaseUrl = (req) => {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  if (req?.headers?.host) {
    const proto = req.headers["x-forwarded-proto"] || "https";
    return `${proto}://${req.headers.host}`;
  }

  return `http://localhost:${port}`;
};

const products = [
  {
    id: "ultrabook-pro-14",
    name: "UltraBook Pro 14",
    description: "Intel Core i7, 16GB RAM, SSD 1TB, ecran 2.8K.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    category: "Laptop",
    specs: ["Intel Core i7", "16GB RAM", "SSD 1TB", "Batterie 12h"]
  },
  {
    id: "noisecancel-x9",
    name: "NoiseCancel X9",
    description: "Casque ANC pro, confort studio et autonomie 40h.",
    price: 349,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    category: "Audio",
    specs: ["ANC hybride", "Bluetooth 5.3", "Autonomie 40h", "Charge USB-C"]
  },
  {
    id: "smartwatch-active",
    name: "SmartWatch Active",
    description: "GPS, NFC, suivi sante avance et mode sport.",
    price: 219,
    image: "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?auto=format&fit=crop&w=1200&q=80",
    category: "Wearable",
    specs: ["GPS", "NFC", "Cardio continu", "Etanche 5 ATM"]
  },
  {
    id: "router-mesh-ax",
    name: "Router Mesh AX",
    description: "Wi-Fi 6 multi-etage, faible latence, controle app.",
    price: 189,
    image: "https://images.unsplash.com/photo-1647427060118-4911c9821b82?auto=format&fit=crop&w=1200&q=80",
    category: "Network",
    specs: ["Wi-Fi 6", "Portee 300m2", "WPA3", "Application mobile"]
  },
  {
    id: "gamepad-elite",
    name: "GamePad Elite",
    description: "Manette pro faible latence avec palettes arriere.",
    price: 129,
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
    category: "Gaming",
    specs: ["Sans fil", "Palettes", "USB-C", "1200mAh"]
  },
  {
    id: "procam-4k",
    name: "ProCam 4K",
    description: "Webcam 4K HDR pour stream et conference pro.",
    price: 159,
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80",
    category: "Creator",
    specs: ["4K 30fps", "HDR", "Micro dual", "Auto-focus"]
  }
];

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && !stripeKey.includes("xxxxx") ? new Stripe(stripeKey) : null;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/products", (_req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const contactPayload = {
    name: String(name).trim(),
    email: String(email).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString()
  };

  const hasMailerConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.CONTACT_TO_EMAIL;

  if (hasMailerConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `ElectroShop Contact <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_TO_EMAIL,
        subject: `New contact message from ${contactPayload.name}`,
        text: `Name: ${contactPayload.name}\nEmail: ${contactPayload.email}\n\n${contactPayload.message}`
      });

      return res.json({ ok: true, mode: "email" });
    } catch (error) {
      console.error("Contact email error:", error.message);
      return res.status(500).json({ error: "Unable to send email" });
    }
  }

  console.log("Contact request:", contactPayload);
  return res.json({ ok: true, mode: "log" });
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env"
      });
    }

    const cartItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!cartItems.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const quantityById = cartItems.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const lineItems = Object.entries(quantityById)
      .map(([id, quantity]) => {
        const product = products.find((p) => p.id === id);
        if (!product) {
          return null;
        }

        return {
          quantity,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(product.price * 100),
            product_data: {
              name: product.name,
              description: product.description,
              images: [product.image]
            }
          }
        };
      })
      .filter(Boolean);

    if (!lineItems.length) {
      return res.status(400).json({ error: "No valid products in cart" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${resolveBaseUrl(req)}/success.html`,
      cancel_url: `${resolveBaseUrl(req)}/cancel.html`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error.message);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`ElectroShop Pro server running on ${process.env.BASE_URL || `http://localhost:${port}`}`);
});
