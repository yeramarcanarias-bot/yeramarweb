// ============================================
// YERAMAR - TIENDA SEGURA VERSIÓN 3.0
// ============================================

(function() {
    'use strict';

    // ============================================
    // ⚠️ DATOS DE CONTACTO DEL NEGOCIO ⚠️
    // Estos son valores DE PRUEBA. Cámbialos por los reales en cuanto
    // tengas el teléfono/email exclusivos del negocio.
    // Instrucciones completas en CONFIGURACION.md
    // ============================================
    const CONTACTO = {
        // Formato: prefijo de país + número, SIN espacios, SIN "+", SIN guiones
        // Ejemplo real: España +34 612 345 678  →  "34612345678"
        whatsapp: '34600000000',
        email: 'pedidos@yeramar-artesania.com'
    };

    let productos = [];
    let waitlistEntries = [];
    let activeCategory = "all";

    // Guarda qué acción de contacto se está realizando (para el modal genérico)
    let contactoPendiente = null;

    // Sanitización extrema de inputs
    function sanitizeInput(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/[^a-zA-Z0-9\s@\-áéíóúüñÁÉÍÓÚÜÑ,._]/g, '');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function mostrarToast(texto, esError) {
        const div = document.createElement('div');
        div.className = 'toast' + (esError ? ' error' : '');
        div.textContent = texto;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3300);
    }

    // Cargar datos con control de caché
    async function cargarDatosSeguro() {
        try {
            const response = await fetch('data.json?' + Date.now(), {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error('Error cargando datos');

            const data = await response.json();
            productos = data.productos || [];
            renderProducts();
            renderWaitlist();
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('productsGrid').innerHTML = '<div class="empty-state-msg">⚠️ Error cargando productos. Intenta más tarde.</div>';
        }
    }

    function getIconoCategoria(categoria) {
        const iconos = {
            bolsos: 'fa-bag-shopping',
            pulseras: 'fa-hand-peace',
            pendientes: 'fa-ear-deaf',
            varios: 'fa-gift'
        };
        return iconos[categoria] || 'fa-star';
    }

    function renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        let filtered = activeCategory === "all"
            ? productos
            : productos.filter(p => p.categoria === activeCategory);

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state-msg">✨ Próximamente más piezas artesanales. ✨</div>`;
            return;
        }

        grid.innerHTML = filtered.map(prod => {
            const inStock = prod.stock > 0;
            const stockText = inStock ? `📦 Stock: ${prod.stock} unidad(es)` : "❌ Sin stock · Lista de espera disponible";
            const icono = getIconoCategoria(prod.categoria);

            return `
                <div class="product-card" data-id="${escapeHtml(prod.id)}">
                    <div class="product-img">
                        ${prod.foto ? `<img src="${escapeHtml(prod.foto)}" alt="${escapeHtml(prod.nombre)}" loading="lazy">` : `<i class="fas ${icono}"></i>`}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${escapeHtml(prod.categoria).toUpperCase()}</div>
                        <div class="product-title">${escapeHtml(prod.nombre)}</div>
                        <div class="product-desc">${escapeHtml(prod.descripcion || 'Pieza artesanal única')}</div>
                        <div class="stock-status ${inStock ? '' : 'out'}">${escapeHtml(stockText)}</div>
                        <div class="price">${prod.precio.toFixed(2)} €</div>
                        <div class="card-actions">
                            ${inStock
                                ? `<button class="btn-primary comprar-btn" data-id="${escapeHtml(prod.id)}"><i class="fas fa-shopping-bag"></i> Comprar</button>`
                                : `<button class="btn-outline waitlist-btn" data-id="${escapeHtml(prod.id)}"><i class="fas fa-hourglass-half"></i> Lista espera</button>`}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.comprar-btn').forEach(btn => {
            btn.addEventListener('click', handleComprar);
        });

        document.querySelectorAll('.waitlist-btn').forEach(btn => {
            btn.addEventListener('click', handleWaitlist);
        });
    }

    function handleComprar(e) {
        const id = e.currentTarget.getAttribute('data-id');
        const producto = productos.find(p => p.id === id);
        if (!producto) return;
        comprarProducto(producto);
    }

    function handleWaitlist(e) {
        const id = e.currentTarget.getAttribute('data-id');
        const producto = productos.find(p => p.id === id);
        if (!producto) return;
        agregarAListaEspera(producto);
    }

    function comprarProducto(producto) {
        if (producto.stock <= 0) {
            mostrarToast('Lo sentimos, este producto ya no tiene stock.', true);
            return;
        }

        abrirModalContacto({
            titulo: `🛍️ Pedido: ${producto.nombre}`,
            descripcion: `Precio: ${producto.precio.toFixed(2)} €. Elige cómo prefieres contactarnos para confirmar tu pedido.`,
            construirMensaje: (nombreCliente) => {
                let msg = `¡Hola! Quiero pedir "${producto.nombre}" (${producto.precio.toFixed(2)} €).`;
                if (nombreCliente) msg += `\nMe llamo ${nombreCliente}.`;
                return msg;
            },
            asuntoEmail: `Pedido: ${producto.nombre}`,
            alEnviar: () => {
                mostrarToast(`✨ Abriendo tu pedido de "${producto.nombre}"...`);
            }
        });
    }

    function agregarAListaEspera(producto) {
        const yaExiste = waitlistEntries.some(entry => entry.idProd === producto.id);
        if (yaExiste) {
            mostrarToast(`Ya está "${producto.nombre}" en tu lista de espera.`);
            return;
        }

        abrirModalContacto({
            titulo: `⏳ Lista de espera: ${producto.nombre}`,
            descripcion: 'Cuéntanos cómo prefieres que te avisemos cuando esté disponible.',
            construirMensaje: (nombreCliente) => {
                let msg = `¡Hola! Quiero apuntarme a la lista de espera de "${producto.nombre}". Avisadme cuando esté disponible, por favor.`;
                if (nombreCliente) msg += `\nMe llamo ${nombreCliente}.`;
                return msg;
            },
            asuntoEmail: `Lista de espera: ${producto.nombre}`,
            alEnviar: (nombreCliente) => {
                waitlistEntries.push({
                    idProd: producto.id,
                    nombre: producto.nombre,
                    cliente: nombreCliente ? sanitizeInput(nombreCliente) : '',
                    fecha: new Date().toISOString()
                });
                localStorage.setItem('yeramar_waitlist_temp', JSON.stringify(waitlistEntries));
                renderWaitlist();
                mostrarToast(`✨ Añadido a tu lista de espera. ¡No olvides enviar el mensaje!`);
            }
        });
    }

    // ---- MODAL DE CONTACTO GENÉRICO (WhatsApp / Email) ----
    function abrirModalContacto({ titulo, descripcion, construirMensaje, asuntoEmail, alEnviar }) {
        document.getElementById('channelModalTitle').textContent = titulo;
        document.getElementById('channelModalDesc').textContent = descripcion;
        document.getElementById('channelModalNombre').value = '';
        contactoPendiente = { construirMensaje, asuntoEmail, alEnviar };
        document.getElementById('channelModal').style.display = 'flex';
    }

    function cerrarModalContacto() {
        document.getElementById('channelModal').style.display = 'none';
        contactoPendiente = null;
    }

    function enviarPorWhatsApp() {
        if (!contactoPendiente) return;
        const nombreCliente = sanitizeInput(document.getElementById('channelModalNombre').value.trim());
        const mensaje = contactoPendiente.construirMensaje(nombreCliente);
        const url = `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        contactoPendiente.alEnviar(nombreCliente);
        cerrarModalContacto();
    }

    function enviarPorEmail() {
        if (!contactoPendiente) return;
        const nombreCliente = sanitizeInput(document.getElementById('channelModalNombre').value.trim());
        const mensaje = contactoPendiente.construirMensaje(nombreCliente);
        const url = `mailto:${CONTACTO.email}?subject=${encodeURIComponent(contactoPendiente.asuntoEmail)}&body=${encodeURIComponent(mensaje)}`;
        window.location.href = url;
        contactoPendiente.alEnviar(nombreCliente);
        cerrarModalContacto();
    }

    function renderWaitlist() {
        const container = document.getElementById('waitlistContainer');
        if (!container) return;

        if (waitlistEntries.length === 0) {
            container.innerHTML = `<div class="empty-waitlist"><i class="far fa-clock"></i> No hay productos en espera. Si algún artículo está agotado, pulsa "Lista espera".</div>`;
            return;
        }

        container.innerHTML = waitlistEntries.map(entry => {
            const prodActual = productos.find(p => p.id === entry.idProd);
            const tieneStock = prodActual && prodActual.stock > 0;

            return `
                <div class="waitlist-item">
                    <span><i class="fas fa-star-of-life"></i> ${escapeHtml(entry.nombre)}</span>
                    ${tieneStock
                        ? `<span class="badge-available">✅ ¡YA DISPONIBLE!</span>`
                        : `<span class="badge-waiting">⏳ Sin stock · Te avisaremos</span>`}
                    <button class="waitlist-btn-sm cancel-waitlist" data-id="${escapeHtml(entry.idProd)}">Quitar</button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.cancel-waitlist').forEach(btn => {
            btn.addEventListener('click', handleCancelar);
        });
    }

    function handleCancelar(e) {
        const id = e.currentTarget.getAttribute('data-id');
        waitlistEntries = waitlistEntries.filter(entry => entry.idProd !== id);
        localStorage.setItem('yeramar_waitlist_temp', JSON.stringify(waitlistEntries));
        renderWaitlist();
        mostrarToast('Quitado de tu lista de espera.');
    }

    function cargarWaitlistLocal() {
        const stored = localStorage.getItem('yeramar_waitlist_temp');
        if (stored) {
            try {
                waitlistEntries = JSON.parse(stored);
            } catch (e) {}
        }
        renderWaitlist();
    }

    function setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', handleFilter);
        });
    }

    function handleFilter(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-category');
        renderProducts();
    }

    function setupModal() {
        document.getElementById('channelModalWhatsapp').addEventListener('click', enviarPorWhatsApp);
        document.getElementById('channelModalEmail').addEventListener('click', enviarPorEmail);
        document.getElementById('channelModalCancelar').addEventListener('click', cerrarModalContacto);
        document.getElementById('channelModal').addEventListener('click', (e) => {
            if (e.target.id === 'channelModal') cerrarModalContacto();
        });
    }

    function init() {
        cargarWaitlistLocal();
        cargarDatosSeguro();
        setupFilters();
        setupModal();
    }

    init();
})();
