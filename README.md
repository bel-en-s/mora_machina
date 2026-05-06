# Mora Machina
Developed by

Divino Divino
https://divinodivino.com.ar



Venus es Libre
https://www.instagram.com/venuseslibre/

**Mora Machina** es una extensión de navegador concebida como una pieza artística: una “máquina de la pausa” que habita silenciosamente en la interfaz y observa la actividad del usuario.

A diferencia de los sistemas orientados a optimizar la productividad, Mora Machina introduce interrupciones suaves en el flujo continuo de uso. A través de la detección del movimiento del mouse, la obra registra la actividad sostenida del cuerpo extendido en la pantalla y, tras un período prolongado, interviene con breves mensajes que invitan a la pausa, la respiración y la percepción.

## Concepto

Mora Machina se sitúa en la intersección entre cuerpo y sistema.

El proyecto entiende la interacción digital como una extensión corporal: el movimiento del cursor, la permanencia activa y la repetición de gestos configuran una forma de presencia. En este contexto, la interfaz se convierte en una superficie sensible —una “piel digital”— donde el cuerpo se inscribe como hábito.

La obra no busca representar este proceso, sino operar dentro de él.

A través de un agente visual —un personaje latente en la esquina de la pantalla— Mora Machina observa y ocasionalmente interrumpe. Estas intervenciones no son alertas ni notificaciones funcionales, sino desplazamientos mínimos: pausas que tensionan la continuidad productiva y abren un espacio de percepción.

## Funcionamiento

* La extensión se inyecta en todas las páginas visitadas
* Detecta actividad a través del movimiento del mouse
* Acumula tiempo de uso continuo
* Tras un período prolongado de actividad (60 minutos), activa una intervención
* Muestra un mensaje aleatorio desde un archivo local (`messages.json`)
* Si se detecta inactividad prolongada, el sistema se reinicia

## Interfaz

El sistema se manifiesta como un widget flotante en la esquina inferior derecha de la pantalla.

El personaje permanece en estado “idle” la mayor parte del tiempo, funcionando como una presencia silenciosa. Durante las intervenciones, despliega un globo de texto con animaciones suaves.

El diseño busca evitar fricción con la navegación, manteniendo una estética sutil y no intrusiva.

## Estructura del proyecto

```
/mora-machina
│── manifest.json
│── content.js
│── activity.js
│── ui.js
│── styles.css
│── messages.json
│── assets/
```

## Intención

Mora Machina no es una herramienta de productividad ni un asistente funcional. Es un dispositivo de interrupción.

Propone una inversión mínima en la lógica dominante de la interfaz: en lugar de acelerar, ralentiza; en lugar de asistir, observa; en lugar de optimizar, introduce demora.

En ese gesto, emerge una pregunta:

¿qué sucede cuando la máquina no exige más actividad, sino que la suspende?
