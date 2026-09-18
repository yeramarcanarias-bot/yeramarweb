# Configuración pendiente: teléfono y email reales

La web ya funciona (pedidos y lista de espera abren WhatsApp o Email con el
mensaje redactado), pero ahora mismo usa datos **de prueba**:

- WhatsApp: `34600000000` (número inventado)
- Email: `pedidos@yeramar-artesania.com` (email inventado)

## Cuando tengas el teléfono y el email reales del negocio

1. Abre el archivo `script.js` de esta misma carpeta (`web-public/script.js`).
2. Busca, casi al principio del archivo, este bloque:

```js
const CONTACTO = {
    whatsapp: '34600000000',
    email: 'pedidos@yeramar-artesania.com'
};
```

3. Cambia los dos valores:
   - **whatsapp**: prefijo de país + número, sin espacios, sin `+` y sin guiones.
     Ejemplo: si tu número es `+34 612 345 678`, pon `'34612345678'`.
   - **email**: el correo del negocio tal cual, entre comillas.
     Ejemplo: `'hola@yeramar.com'`.

4. Guarda el archivo.
5. Sube de nuevo la carpeta `web-public` completa por FTP (o al menos el
   archivo `script.js`) para que el cambio se refleje en la web online.

No hace falta tocar nada más — ni `index.html`, ni el panel de Electron,
ni `data.json`. Solo ese bloque de `script.js`.

## Cómo funciona ahora mismo

- Botón **"Comprar"** → abre un cuadro donde el cliente elige WhatsApp o
  Email, con el pedido ya redactado (nombre del producto y precio).
- Botón **"Lista espera"** → mismo cuadro, pero con un mensaje pidiendo que
  le avisen cuando el producto vuelva a tener stock. Además queda guardado
  localmente en el navegador del cliente como recordatorio (esto es solo
  para que él lo vea en su lista de espera personal; el aviso real te llega
  a ti por WhatsApp o Email cuando pulsa el botón correspondiente).
