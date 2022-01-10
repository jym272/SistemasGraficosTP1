# Estación espacial

Escena 3D que consiste en una estación espacial más una capsula que vuela en
forma independiente sobre la superficie de la tierra.
    
    Se trabajo sobre WebGl 2.0 con los lenguajes de Javascript y GLSL.
    Se usa el framework de Webpack para el desarrollo, manejo de archivos, estadísticas y paquete final.

## Setup
Descargar [Node.js](https://nodejs.org/en/download/).
Correr los siguientes comandos:

``` bash
# Instala dependencias (por única vez)
npm install

# Local server at localhost:8080
npm run dev

# Build para producción en el directorio de docs/, crea el bundle y el index.html
npm run build

# Bundle Analizer, permite observar el tamano de las librerías respecto al bundle final
npm run stats
```

Los distintos controles se muestran en detalle, cuando se inicie el programa, algunos de ellos son:
## Cámaras Orbitales
'1' ⇨ Cámara centrada en la estación espacial.

'2' ⇨ Cámara centrada en los paneles solares.

'3' ⇨ Cámara de la cápsula espacial.

'4' ⇨ Cámara del satélite Luna.

'5' ⇨ Cámara del planeta Tierra.

'z'/'x' ⇨ Zoom por teclado

## Controles Cápsula Espacial

    ASDW para desplazarla en el plano XZ.
    QE   para desplazarla en el eje Y.
    JL   para controlar el angulo de “guiñada”
    IK   para controlar el angulo de “cabezeo”
    UO   para controlar el angulo de “alabeo”
    R    La cápsula regresa a la estación.
    T    La cápsula frena in situ.


### Referencias

[Sistemas Gráficos Teoría](https://youtube.com/playlist?list=PLZPWYlypA6MqOPCNlj1UvKawebDzU2-Dd) |
[Real-Time 3D Graphics with WebGL 2](https://github.com/PacktPublishing/Real-Time-3D-Graphics-with-WebGL-2) |
[Learn OpenGl](https://learnopengl.com/)