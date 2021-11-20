# Estación espacial

Escena 3D que consiste en una estación espacial más una capsula que vuela en
forma independiente sobre la superficie de la tierra.
    
    Se usa Javascript Vanilla, WebGl 2.0 y la librería de gl-matrix.
    Se usa el framework de Webpack para la compilación de Javascript y manejo de archivos.

## Setup
Descargar [Node.js](https://nodejs.org/en/download/).
Correr los siguientes comandos:

``` bash
# Instala dependencias (por única vez)
npm install

# Local server at localhost:8080
npm run dev

# Build para producción en el directorio de docs/
npm run build
```

## Cámaras Orbitales
'1' -> Cámara centrada en la estación espacial.

'2' -> Cámara centrada en los paneles solares.

'3' -> Cámara de la cápsula espacial.

### Mouse
Click izquierdo con movimientos del mouse para mover la cámara órbital.

Combinar con la tecla "Alt" o en su defecto la rueda del mouse para zoom.

## Controles Cápsula Espacial

    ASDW para desplazarla en el plano XZ.
    QE   para desplazarla en el eje Y.
    JL   para controlar el angulo de “guiñada”
    IK   para controlar el angulo de “cabezeo”
    UO   para controlar el angulo de “alabeo”
    R    La cápsula regresa a la estación.
    T    La cápsula frena in situ.


### Referencia
Módulos del código que abstraen conceptos del pipeline gráfico fueron tomados de [Real-Time 3D Graphics with WebGL 2](https://github.com/PacktPublishing/Real-Time-3D-Graphics-with-WebGL-2).
