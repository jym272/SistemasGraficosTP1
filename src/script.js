'use strict';
import './style.css'
import {dimensiones} from "./js/dimensiones";
import {utils} from './js/utils';
import {Program} from "./js/Program";
import {Scene} from "./js/Scene";
import {Camera} from "./js/Camera";
import {Controls} from "./js/Controls";
import {Transforms} from "./js/Transforms";
import {AnimacionPanelesSolares, PanelSolar} from "./js/PanelSolar";
import {Cilindro, Plano, Superficie, Tapa, Tubo,} from "./js/Superficies";
import {Forma, SuperficieParametrica, SuperficieParametrica1} from "./js/SuperficiesDeBarrido";
import {Bloque} from "./js/Bloque";
import {CurvaCubicaDeBezier} from "./js/CurvasDeBezier";
import {DroneCameraControl} from "./js/droneCamara";
import {colores} from "./js/colores";
import {Anillo, Bloques, Capsula, Esfera, Nave, PanelesSolares, TransformacionesAfin} from "./js/TransformacionesAfin";
import {mat4} from "gl-matrix";
import {Texture} from "./js/Texture";
import {Light, LightsManager} from "./js/Light";

import UVdiffuse from './images/UV.jpg';
import UVnormal from './images/UV_normal.jpg';

import CubeTexture from './geometries/cube-texture.json5'
import Sphere from './geometries/sphere.json5'

let
    gl, scene, program, camera, transforms, transformar, bloque, panelSolar, controles, droneCam,
    targetNave, targetPanelesSolares, //focus de la nave y los paneles en el cual se enfoca la camara
    elapsedTime, initialTime, cubeTexture,
    triangleStrip = true,
    wireframe = false,
    sunLightColor, lightAmbient, lightSpecular,
    textureEarthClouds,
    textureMap, lights,
    SpecularMap = true,//8.0,  //para ajustar posiciones de los objetos, se usa en el diseño
    dxAnillo = 0.01,
    lightPosition = [100, 100, 100],
    lightsData = [],
    lightLerpOuterCutOff = 0.5,
    lightOuterCutOff = 17.5,
    lightRadius = 100.0,
    exponentFactor = 10,
    lightDecay = 0.5,
    spotLightDir,
    minLambertTerm = 0.1,
    cubeMapInScene = true,
    luzSolarEncendida = true,
    lightAzimuth = 0,
    lightElevation = 260,
    animationRate; //ms


const colorGenerico = colores.RojoMetalico;

function configure() {
    // Configure `canvas`
    const canvas = utils.getCanvas('webgl-canvas');
    utils.autoResizeCanvas(canvas);

    // Configure `gl`
    gl = utils.getGLContext(canvas);
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Configure `program`
    program = new Program(gl, 'vertex-shader', 'fragment-shader');

    const attributes = [
        'aVertexPosition',
        'aVertexNormal',
        'aVertexTangent',
        'aVertexColor',
        'aVertexTextureCoords',
    ];

    const uniforms = [
        'uProjectionMatrix',
        'uViewMatrix',
        'uModelViewMatrix',
        'uNormalMatrix',
        'uMaterialDiffuse',
        'uMaterialAmbient',
        'uMaterialSpecular',
        'uLightAmbient',
        'uLightDiffuse',
        'uLightSpecular',
        'uLightPosition',
        'uLightDirection',
        'uShininess',
        'uWireframe',
        'uAjuste',
        'uHasTexture',
        'uIsTheCubeMapShader',
        'uSampler',
        'uCloudSampler',
        'uSpecularSampler',
        'uActivateEarthTextures',
        'uActivateSpecularTexture',
        'uNormalSampler',
        'uCubeSampler',
        'uLightSource',
        'uOuterCutOff',
        'uLerpOuterCutOff',
        'uExponentFactor',
        'uLightRadius',
        'uLightDecay',
        'uMinLambertTerm',
        'uLuzSolarEncendida'
    ];

    // Load attributes and uniforms
    program.load(attributes, uniforms);

    // Configure `scene`
    scene = new Scene(gl, program);

    // Configure `camera` and `controls`
    camera = new Camera(Camera.ORBITING_TYPE, 70, 0);
    camera.goTo([0, 0, 40], 0, -30, [0, 0, 0])
    droneCam = new DroneCameraControl([0, 0, -10], camera);
    spotLightDir = new DireccionSpotLight(0, -95);  //234/-72

    controles = new Controls(camera, canvas, droneCam, spotLightDir);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);


    //Bloques del anillo
    bloque = new Bloque(dimensiones.anillo.radio, scene)

    const intervaloEnGrados = 30; //cada 15,30, 45, 60, 75, 90 grados del giro del anillo
    //Transformaciones afines
    transformar = new TransformacionesAfin(transforms, droneCam, controles, camera, bloque,
        new AnimacionPanelesSolares(300, intervaloEnGrados)
    );

    //Lights

}

function cargarTexturas() {


    cubeTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    //cada vez que empieza el programa, elige aleatoriamente un set de texturas para el cubemap
    let random = Math.floor(Math.random() * 3);
    transformar.tierraLunaEnElMundo(random)
    sunLightColor = utils.normalizeColor(colores.sunLightColor[random])


    //luego ubicar las luces en un sitio mas adecuado como una funcion
// Helper to manage multiple lights
    lights = new LightsManager();
    // Lights data
    lightsData = [
        {
            id: 'sunLight', name: 'Luz solar',
            position: dimensiones.lightPosition[random],
            diffuse: sunLightColor,
            direction: dimensiones.lightPosition[random] //la luz solar no tiene direccion, este valor no se termina usando
        },
        {
            id: 'greenLight', name: 'Green Light',
            position: [0, 10.0, 5], diffuse: [0, 1, 0, 1], direction: spotLightDir.vector
        },
        {
            id: 'blueLight', name: 'Blue Light',
            position: [0, 10.0, -5], diffuse: [0, 0, 1, 1], direction: spotLightDir.vector
        },
    ];
    lightsData.forEach(({id, position, diffuse, direction}) => {
        const light = new Light(id);
        light.setPosition(position);
        light.setDiffuse(diffuse);
        light.setProperty('direction', direction);
        lights.add(light);
    });
    spotLightDir.esteEsElLightsArray(lights.getArray('direction'))

    //para todas las luces
    lightAmbient = [0.1, 0.1, 0.1, 1.0];
    lightSpecular = [1.0, 1.0, 1.0, 1.0];

    // console.log(lights.getArray('direction'))
    gl.uniform3fv(program.uLightPosition, lights.getArray('position'));
    gl.uniform3fv(program.uLightDirection, lights.getArray('direction'));
    gl.uniform4fv(program.uLightDiffuse, lights.getArray('diffuse'));

    gl.uniform4fv(program.uLightAmbient, lightAmbient);
    gl.uniform4fv(program.uLightSpecular, lightSpecular);
    gl.uniform1f(program.uShininess, 230.0);

    gl.uniform1i(program.uLuzSolarEncendida, luzSolarEncendida);


    gl.uniform1f(program.uOuterCutOff, lightOuterCutOff);
    gl.uniform1f(program.uLerpOuterCutOff, lightLerpOuterCutOff);
    gl.uniform1f(program.uLightRadius, lightRadius);
    gl.uniform1f(program.uLightDecay, lightDecay);
    gl.uniform1f(program.uMinLambertTerm, minLambertTerm);


    gl.uniform1f(program.uExponentFactor, exponentFactor);

    cargarTexturasCubemap(random);

    // Textures
    textureMap = {}
    textureMap["UV"] = {
        diffuse: new Texture(gl, UVdiffuse),
        normal: new Texture(gl, UVnormal),
    }
    textureMap["bloque"] = {
        diffuse: new Texture(gl, 'bloque/1/diffuse.jpg'),
        normal: new Texture(gl, 'bloque/1/normal.jpg'),
        specular: new Texture(gl, 'bloque/1/specular.jpg')
    }

    //Asignando unidades de texturas
    const cubeMapTextureUnit = 0;
    const samplerTextureUnit = 1;
    const normalTextureUnit = 2;

    gl.uniform1i(program.uCubeSampler, cubeMapTextureUnit);
    gl.uniform1i(program.uSampler, samplerTextureUnit);
    gl.uniform1i(program.uNormalSampler, normalTextureUnit);

    //texturas adicionales de la tierra
    const cloudTextureUnit = 3;
    const specularTextureUnit = 4;
    gl.uniform1i(program.uCloudSampler, cloudTextureUnit);
    gl.uniform1i(program.uSpecularSampler, specularTextureUnit);


    // console.log("cubeSampler",program.getUniform(program.uCubeSampler))
    // console.log("sampler",program.getUniform(program.uSampler))
    // console.log("normal",program.getUniform(program.uNormalSampler))


}

function cargarTexturasCubemap(random) {

    switch (random) {
        case 0:
            import ('./images/skyBox/1/Left_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, url.default);
                });
            import ('./images/skyBox/1/Right_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, url.default);
                });
            import ('./images/skyBox/1/Up_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, url.default);
                });
            import ('./images/skyBox/1/Down_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, url.default);
                });
            import ('./images/skyBox/1/Front_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, url.default);
                });
            import ('./images/skyBox/1/Back_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, url.default);
                });
            break;
        case 1:
            import('./images/skyBox/2/Left_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, url.default);
                });
            import('./images/skyBox/2/Right_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, url.default);
                });
            import('./images/skyBox/2/Up_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, url.default);
                });
            import('./images/skyBox/2/Down_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, url.default);
                });
            import('./images/skyBox/2/Front_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, url.default);
                });
            import('./images/skyBox/2/Back_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, url.default);
                });
            break;
        case 2:
            import('./images/skyBox/3/Left_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, url.default);
                });
            import('./images/skyBox/3/Right_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, url.default);
                });
            import('./images/skyBox/3/Up_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, url.default);
                });
            import('./images/skyBox/3/Down_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, url.default);
                });
            import('./images/skyBox/3/Front_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, url.default);
                });
            import('./images/skyBox/3/Back_1K_TEX.png')
                .then((url) => {
                    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, url.default);
                });
            break;
    }
}

function loadCubemapFace(gl, target, texture, url) {
    const image = new Image();
    image.src = url;
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    };
}

// Se carga todos los objetos a la escena
function load() {
    // Sphere.alias = "light"
    // scene.add(Sphere);

    // scene.add(new Floor(80, 1));
    // scene.add(new Axis(82));


    scene.add(CubeTexture, {
        alias: "cubeMap"
    });


    //luces puntual y las dos spotlight
    lightsData.forEach(({id}) => {
        const SphereClone = Object.assign({}, Sphere);
        SphereClone.alias = id;
        scene.add(SphereClone);
    });


    scene.add(new Superficie(null, 'nave'))
    cargarNucleo()
    panelSolar = new PanelSolar(scene);
    panelSolar.cargarPanelesSolares()
    cargarAnillo()
    bloque.setType(Bloque.BLOQUES_4);
    moduloVioleta()
    cargarEsfera()
    cargarCapsula()
    cargarALaLuna()
    cargarALaTierra()


    // cargarEscenario();
    // cargarEsferaEnElEscenario();
}

function cargarEsferaEnElEscenario() {


    const pasoDiscretoRecorrido = 25
    const divisionesForma = 25 //precision en la forma

    const porcionDeCircunferencia = 1 / 2
    const radio = 5//120
    //reutilizo la funcion para crear una forma circular
    const forma = utils.crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)

    //rotar los puntos del recorrido x,y 45 grados
    const datosDeLaForma = {
        puntos: forma.puntos,
        normales: forma.binormales.map(punto => {
            return [
                punto[0], punto[1]]
        }),
        tangentes: forma.tangentes.map(punto => {
            return [
                punto[0], punto[1]
            ]
        }),
    }

    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

    //Klave para la sup de Rev
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    const luna = new SuperficieParametrica1("esferaEscenario", datosDeLaForma, datosDelRecorrido, dimensiones, true)

    const nuevasTangentes = utils.calcularTanYBiTan(luna)

    luna.tangentes = nuevasTangentes.tangentes
    luna.diffuse = colores.Textura.diffuse
    luna.ambient = colores.Textura.ambient

    luna.texture = 'esferaEscenario'
    textureMap[luna.texture] = {
        diffuse: new Texture(gl, 'moon/diffuse1080.jpg'),
        normal: new Texture(gl, 'moon/normal1080.jpg')
    }
    scene.add(luna)


}

function cargarEscenario() {
    /*
        CubeComplex.alias = "cubeComplexTest";
        //map item of vertices
        const newVertices  = []
        CubeComplex.vertices.map((vertex, index) => {
            newVertices.push(vertex*20)
        });
        console.log(CubeComplex, newVertices)
        CubeComplex.vertices = newVertices;

           tapaSuperior.diffuse = colores.Textura.diffuse
        tapaSuperior.ambient = colores.Textura.ambient
        tapaSuperior.texture = "UV"

        scene.add(CubeComplex);
    */
    //El escenario tiene 3 planos
    const dimensionesTriangulos = {
        filas: 30,
        columnas: 30,
    }
    const dimensiones = {
        ancho: 50,
        largo: 50,
    }

    const escenario = new Superficie(null, "escenario");

    const caraInferior = new Plano('caraInferior', dimensiones, dimensionesTriangulos)
    const caraLateralIzquierda = new Plano('caraLateralIzquierda', dimensiones, dimensionesTriangulos)
    const caraUp = new Plano('caraUp', dimensiones, dimensionesTriangulos)
    const caraLateralDerecha = new Plano('caraLateralDerecha', dimensiones, dimensionesTriangulos)
    const caraFondo = new Plano('caraFondo', dimensiones, dimensionesTriangulos)

    //transformaciones cara lateral izquierda
    const t_LatIzq_rot = mat4.identity(mat4.create());
    mat4.rotate(t_LatIzq_rot, t_LatIzq_rot, -Math.PI / 2, [0, 0, 1]);

    const LatIzq_NEW_normals_tangents = utils.nuevasCoordenadas(t_LatIzq_rot, caraLateralIzquierda, false)

    const t_LatIzq_tras = mat4.identity(mat4.create());
    mat4.translate(t_LatIzq_tras, t_LatIzq_tras, [-dimensiones.ancho / 2, dimensiones.ancho / 2, 0]);
    mat4.multiply(t_LatIzq_tras, t_LatIzq_tras, t_LatIzq_rot);

    const LatIzq_NEW = utils.nuevasCoordenadas(t_LatIzq_tras, caraLateralIzquierda, false)

    //transformaciones caraUp
    const t_CaraUp_rot = mat4.identity(mat4.create());
    mat4.rotate(t_CaraUp_rot, t_CaraUp_rot, Math.PI, [1, 0, 0]);

    const CaraUp_NEW_normals_tangents = utils.nuevasCoordenadas(t_CaraUp_rot, caraUp, false)

    const t_CaraUp_tras = mat4.identity(mat4.create());
    mat4.translate(t_CaraUp_tras, t_CaraUp_tras, [0, dimensiones.largo, 0]);
    mat4.multiply(t_CaraUp_tras, t_CaraUp_tras, t_CaraUp_rot);

    const CaraUp_NEW = utils.nuevasCoordenadas(t_CaraUp_tras, caraUp, false)

    //transformaciones cara lateral derecha
    const t_LatDer_rot = mat4.identity(mat4.create());
    mat4.rotate(t_LatDer_rot, t_LatDer_rot, Math.PI / 2, [0, 0, 1]);

    const LatDer_NEW_normals_tangents = utils.nuevasCoordenadas(t_LatDer_rot, caraLateralDerecha, false)

    const t_LatDer_tras = mat4.identity(mat4.create());
    mat4.translate(t_LatDer_tras, t_LatDer_tras, [dimensiones.ancho / 2, dimensiones.ancho / 2, 0]);
    mat4.multiply(t_LatDer_tras, t_LatDer_tras, t_LatDer_rot);

    const LatDer_NEW = utils.nuevasCoordenadas(t_LatDer_tras, caraLateralDerecha, false)

    //transformaciones caraFondo
    const t_CaraFondo_rot = mat4.identity(mat4.create());
    mat4.rotate(t_CaraFondo_rot, t_CaraFondo_rot, Math.PI / 2, [1, 0, 0]);

    const CaraFondo_NEW_normals_tangents = utils.nuevasCoordenadas(t_CaraFondo_rot, caraFondo, false)

    const t_CaraFondo_tras = mat4.identity(mat4.create());
    mat4.translate(t_CaraFondo_tras, t_CaraFondo_tras, [0, dimensiones.largo / 2, -dimensiones.largo / 2]);
    mat4.multiply(t_CaraFondo_tras, t_CaraFondo_tras, t_CaraFondo_rot);

    const CaraFondo_NEW = utils.nuevasCoordenadas(t_CaraFondo_tras, caraFondo, false)


    const newVertices = []
    newVertices.push(
        ...caraInferior.vertices,
        ...LatIzq_NEW.vertices,
        ...CaraUp_NEW.vertices,
        ...LatDer_NEW.vertices,
        ...CaraFondo_NEW.vertices
    )

    const newNormals = []
    newNormals.push(
        ...caraInferior.normales,
        ...LatIzq_NEW_normals_tangents.normales,
        ...CaraUp_NEW_normals_tangents.normales,
        ...LatDer_NEW_normals_tangents.normales,
        ...CaraFondo_NEW_normals_tangents.normales
    )
    const newTexCoords = []
    newTexCoords.push(
        ...caraInferior.textureCoords,
        ...caraInferior.textureCoords,
        ...caraInferior.textureCoords,
        ...caraInferior.textureCoords,
        ...caraInferior.textureCoords
    )

    const newIndices = []

    const LatIzq_NEW_indices = []

    const indexMaxCaraInferior = caraInferior.indices[caraInferior.indices.length - 1]
    caraLateralIzquierda.indices.forEach(indice => {
        LatIzq_NEW_indices.push(indice + indexMaxCaraInferior + 1);
    });

    const indicesMaxLatIzq = LatIzq_NEW_indices[LatIzq_NEW_indices.length - 1]

    const CaraUp_NEW_indices = []
    caraUp.indices.forEach(indice => {
        CaraUp_NEW_indices.push(indice + indicesMaxLatIzq + 1);
    });

    const indicesMaxCaraUp = CaraUp_NEW_indices[CaraUp_NEW_indices.length - 1]

    const LatDer_NEW_indices = []
    caraLateralDerecha.indices.forEach(indice => {
        LatDer_NEW_indices.push(indice + indicesMaxCaraUp + 1);
    });

    const indicesMaxLarDer = LatDer_NEW_indices[LatDer_NEW_indices.length - 1]

    const CaraFondo_NEW_indices = []
    caraFondo.indices.forEach(indice => {
        CaraFondo_NEW_indices.push(indice + indicesMaxLarDer + 1);
    });


    newIndices.push(
        ...caraInferior.indices, caraInferior.indices[caraInferior.indices.length - 1], LatIzq_NEW_indices[0],
        ...LatIzq_NEW_indices, LatIzq_NEW_indices[LatIzq_NEW_indices.length - 1], CaraUp_NEW_indices[0],
        ...CaraUp_NEW_indices, CaraUp_NEW_indices[CaraUp_NEW_indices.length - 1], LatDer_NEW_indices[0],
        ...LatDer_NEW_indices, LatDer_NEW_indices[LatDer_NEW_indices.length - 1], CaraFondo_NEW_indices[0],
        ...CaraFondo_NEW_indices,
    )

    const newTangentes = []
    newTangentes.push(
        ...caraInferior.tangentes,
        ...LatIzq_NEW_normals_tangents.tangentes,
        ...CaraUp_NEW_normals_tangents.tangentes,
        ...LatDer_NEW_normals_tangents.tangentes,
        ...CaraFondo_NEW_normals_tangents.tangentes
    )


    escenario.vertices = newVertices;
    escenario.normales = newNormals;
    escenario.textureCoords = newTexCoords;
    escenario.indices = newIndices;
    escenario.tangentes = newTangentes;

    escenario.diffuse = colores.Textura.diffuse
    escenario.ambient = colores.Textura.ambient
    escenario.texture = "UV"


    scene.add(escenario);


}

class DireccionSpotLight {
    constructor(azimuth, elevation) {
        this.vector = [0, 0, 0];
        this.azimuth = azimuth;
        this.elevation = elevation;
        this.azimuthElevationToVector();
    }

    validarAngulos() {
        if (this.azimuth < 0 || this.azimuth > 360) {
            this.azimuth = this.azimuth % 360;
        }
        if (this.elevation < 0 || this.elevation > 360) {
            this.elevation = this.elevation % 360;
        }
    }

    azimuthElevationToVector() {
        this.validarAngulos();
        const {azimuth, elevation} = this;
        const theta = azimuth * Math.PI / 180;
        const phi = elevation * Math.PI / 180;
        const x = Math.cos(phi) * Math.cos(theta);
        const z = Math.cos(phi) * Math.sin(theta);
        const y = Math.sin(phi);
        this.vector = [x, y, z];
        // this.printNewVector();
    }

    printNewVector() {
        console.clear()
        console.log(`${this.azimuth.toFixed(1)}° azimuth, ${this.elevation.toFixed(1)}° elevation`);
        console.log(`-> ${this.vector[0].toFixed(2)}, ${this.vector[1].toFixed(2)}, ${this.vector[2].toFixed(2)}`);
    }

    cambiarAzimuth(incremento, valor = null) {
        if(valor === null){
            this.azimuth += incremento;
        }else{
            this.azimuth = valor;
        }

        this.azimuth += incremento;
        this.azimuthElevationToVector();
        this.actualizarEnLaEscena();
    }

    cambiarElevation(incremento, valor = null) {
        if(valor === null){
            this.elevation += incremento;
        }else{
            this.elevation = valor;
        }

        this.elevation += incremento;
        this.azimuthElevationToVector();
        this.actualizarEnLaEscena();
    }

    actualizarEnLaEscena() {
        this.lightArray[3] = this.vector[0];
        this.lightArray[4] = this.vector[1];
        this.lightArray[5] = this.vector[2];

        this.lightArray[6] = this.vector[0];
        this.lightArray[7] = this.vector[1];
        this.lightArray[8] = this.vector[2];

        // console.log(this.lightArray)
        gl.uniform3fv(program.uLightDirection, this.lightArray);
    }

    esteEsElLightsArray(lightsArrayDirection) {
        this.lightArray = lightsArrayDirection;
    }

}


function cargarALaTierra() {
    const pasoDiscretoRecorrido = 50
    const divisionesForma = 50 //precision en la forma

    const porcionDeCircunferencia = 1 / 2
    const radio = 1405
    //reutilizo la funcion para crear una forma circular
    const forma = utils.crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)

    //rotar los puntos del recorrido x,y 45 grados
    const datosDeLaForma = {
        puntos: forma.puntos,
        normales: forma.binormales.map(punto => {
            return [
                punto[0], punto[1]]
        }),
        tangentes: forma.tangentes.map(punto => {
            return [
                punto[0], punto[1]
            ]
        }),
    }

    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

    //Klave para la sup de Rev
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    const tierra = new SuperficieParametrica1("tierra", datosDeLaForma, datosDelRecorrido, dimensiones, true)

    const nuevasTangentes = utils.calcularTanYBiTan(tierra)

    tierra.tangentes = nuevasTangentes.tangentes
    tierra.diffuse = colores.Textura.diffuse
    const gray = 0.1
    tierra.ambient = [gray, gray, gray, 1]

    tierra.texture = 'tierra'
    textureMap[tierra.texture] = {
        diffuse: new Texture(gl, 'earth/Earth.Diffuse.3840.jpg'),
        normal: new Texture(gl, 'earth/Earth.Normal.3840.jpg'),
        specular: new Texture(gl, 'earth/Earth.Specular.3840.jpg')
    }

    textureEarthClouds = new Texture(gl, 'earth/Earth.Clouds.3840.jpg')

    scene.add(tierra)

}

function cargarALaLuna() {

    const pasoDiscretoRecorrido = 50
    const divisionesForma = 50 //precision en la forma

    const porcionDeCircunferencia = 1 / 2
    const radio = 345//120
    //reutilizo la funcion para crear una forma circular
    const forma = utils.crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)

    //rotar los puntos del recorrido x,y 45 grados
    const datosDeLaForma = {
        puntos: forma.puntos,
        normales: forma.binormales.map(punto => {
            return [
                punto[0], punto[1]]
        }),
        tangentes: forma.tangentes.map(punto => {
            return [
                punto[0], punto[1]
            ]
        }),
    }

    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

    //Klave para la sup de Rev
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    const luna = new SuperficieParametrica1("luna", datosDeLaForma, datosDelRecorrido, dimensiones, true)

    const nuevasTangentes = utils.calcularTanYBiTan(luna)

    luna.tangentes = nuevasTangentes.tangentes
    luna.diffuse = colores.Textura.diffuse
    luna.ambient = colores.Textura.ambient

    luna.texture = 'luna'
    textureMap[luna.texture] = {
        diffuse: new Texture(gl, 'moon/diffuse1080.jpg'),
        normal: new Texture(gl, 'moon/normal1080.jpg')
    }
    scene.add(luna)


}

function cargarCapsula() {
    /*
     *Capsula
     *->Cola de la capsula construida con curva de bezier como forma y con un recorrido
     *  colapsado circular con radio cero ---> Sup de revolucion
     *->El recorrido va ser circular con radio 0, mientras mas puntos pasoDiscretoRecorrido
     *  mas se parece a una circunferencia en lugar de un poligono -> tomar en cuenta para la tapa
     */
    const pasoDiscretoRecorrido = 30
    const divisionesForma = 10 //precision en la forma,
    //Azul Polenta [0,4/255,1,1],
    const arraycolores = [
        [247, 144 / 255, 0 / 255, 1],//fuegoCuerpo
        [247, 90 / 255, 0 / 255, 1],//capsulaCola
        [247, 19 / 255, 0 / 255, 1],//fuegoCola
    ]
    const dimensionesCapsulaCilindro = {
        filas: 1, //segmentosRadiales
        columnas: pasoDiscretoRecorrido, //segmentosDeAltura
    };
    /*
     * Abstraccion de la capsula
     * -> transformando la matriz relacionada de este objeto muevo a la capsula
     */
    const capsula = new Superficie(null, 'capsula')
    scene.add(capsula)

    /*
     *Cola
     */
    Capsula.curvaColav0x = -1.99
    const curvaCola = new CurvaCubicaDeBezier(
        [Capsula.curvaColav0x, 0.78],
        [-1.2, 0.785],
        [-0.66, 0.52],
        [-0.14, 0.18]
    );

    const puntosBezierCola = curvaCola.extraerPuntos(divisionesForma)
    const datosDeLaForma = {
        puntos: puntosBezierCola.puntos,
        normales: puntosBezierCola.puntosTangentes.map(p => {
            return [-p[1], p[0]]
        }),
    }


    //Creo una Superficie de Revolucion
    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

    //Klave para la sup de Rev -> radio 0
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    const capsulaCola = new SuperficieParametrica("capsulaCola", datosDeLaForma, datosDelRecorrido, dimensiones, true)
    scene.add(capsulaCola, {
        diffuse: arraycolores[1],
    });

    const capsulaFuegoCola = (new Cilindro('capsulaFuegoCola', {
        radioSuperior: 0.78,
        radioInferior: 0.05,
        altura: 0.5,
    }, dimensionesCapsulaCilindro, true))
    scene.add(capsulaFuegoCola, {
        diffuse: arraycolores[2],
    });


    /*
     * Cuerpo de la Capsula
     */
    const curvaCuerpo = new CurvaCubicaDeBezier(
        [0.3, 1.5],
        [1.185, 1.44],
        [1.844, 1.185],
        [2.5, 0.7]
    );
    const puntosBezierCuerpo = curvaCuerpo.extraerPuntos(divisionesForma)

    const datosDeLaFormaCuerpo = {
        puntos: puntosBezierCuerpo.puntos,
        normales: puntosBezierCuerpo.puntosTangentes.map(p => {
            return [-p[1], p[0]]
        }),
    }

    //Creo una Superficie de Revolucion
    const pasoDiscretoCuerpo = datosDeLaFormaCuerpo.puntos.length - 1
    const dimensionesCuerpo = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoCuerpo, //divisiones de la forma
    }
    const cuerpo = new SuperficieParametrica("capsulaCuerpoBezierA", datosDeLaFormaCuerpo, datosDelRecorrido, dimensionesCuerpo, true)
    scene.add(cuerpo)

    Capsula.CilAaltura = 0.1
    const capsulaCuerpoCilindroA = (new Cilindro('capsulaCuerpoCilindroA', {
        radioSuperior: 0.4,
        radioInferior: 1.2,
        altura: Capsula.CilAaltura,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroA)

    const capsulaCuerpoCilindroB = (new Cilindro('capsulaCuerpoCilindroB', {
        radioSuperior: 1.2,
        radioInferior: 1.5,
        altura: 0.2,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroB)

    const capsulaCuerpoCilindroC = (new Cilindro('capsulaCuerpoCilindroC', {
        radioSuperior: 0.7,
        radioInferior: 0.6,
        altura: 0.01,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroC)

    const capsulaCuerpoCilindroD = (new Cilindro('capsulaCuerpoCilindroD', {
        radioSuperior: 0.6,
        radioInferior: 0.4,
        altura: 2.9 - 2.51,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroD, {diffuse: colorGenerico})

    const capsulaCuerpoCilindroE = (new Cilindro('capsulaCuerpoCilindroE', {
        radioSuperior: 0.4,
        radioInferior: 0,
        altura: 0.001,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroE)

    Capsula.FuegoCuerpoAltura = 0.5;
    const capsulaFuegoCuerpo = (new Cilindro('capsulaFuegoCuerpo', {
        radioSuperior: 1.2,
        radioInferior: 0.05,
        altura: Capsula.FuegoCuerpoAltura,
    }, dimensionesCapsulaCilindro, true))
    scene.add(capsulaFuegoCuerpo, {
        diffuse: arraycolores[0],
    });

}

function cargarEsfera() {
    //Creo una Superficie de Revolucion

    /*
    Dimensiones de la esfera
     */
    //El recorrido va ser circular con radio 0, mientras mas puntos mas se parece a
    //una circunferencia en lugar de un poligono -> tomar en cuenta para la tapa
    const pasoDiscretoRecorrido = 30
    const divisionesForma = 20 //precision en la forma,
    ///////////////////////////////////////////////////////////////////
    const porcionDeCircunferencia = 2 / 8 //la forma va de pi/4 a (pi-pi/4) -> 25% del circulo
    const radio = Esfera.radio //2
    //reutilizo la funcion para crear una forma circular
    const forma = utils.crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)
    //rotar los puntos del recorrido x,y 45 grados
    const angulo = Esfera.angulo     //Math.PI/4 //tengo que rotar, los puntos obtenidos parten de cero
    //los pts me sirven, las binormales, le quito la z y son las normales
    const datosDeLaForma = {
        puntos: forma.puntos.map(punto => {
            return [
                punto[0] * Math.cos(angulo) - punto[1] * Math.sin(angulo),
                punto[0] * Math.sin(angulo) + punto[1] * Math.cos(angulo)
            ]
        }),
        normales: forma.binormales.map(punto => {
            return [
                punto[0] * Math.cos(angulo) - punto[1] * Math.sin(angulo),
                punto[0] * Math.sin(angulo) + punto[1] * Math.cos(angulo)
            ]
        }),
        tangentes: forma.tangentes.map(punto => {
            return [
                punto[0] * Math.cos(angulo) - punto[1] * Math.sin(angulo),
                punto[0] * Math.sin(angulo) + punto[1] * Math.cos(angulo)
            ]
        }),
    }
    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    /*
    Superficie de Revolucion
     */
    const esfera = new Superficie(null, "esfera")

    const cuerpo = new SuperficieParametrica1("esfera_cuerpo", datosDeLaForma, datosDelRecorrido, dimensiones, true)

    const tapaAtras = new Tapa('esfera_TapaAtras', radio * Math.sin(angulo), {
        filas: 1, //segmentosRadiales
        columnas: pasoDiscretoRecorrido, //segmentosDeAltura
    })

    const tapaAdelante = new Tapa('esfera_TapaAdelante', radio * Math.sin(angulo), {
        filas: 1, //segmentosRadiales
        columnas: pasoDiscretoRecorrido, //segmentosDeAltura
    })

    /*
     * Transformaciones
     */
    //Tapa Adelante
    const tapaAdelanteNyT = mat4.identity(mat4.create());
    mat4.rotate(tapaAdelanteNyT, tapaAdelanteNyT, Math.PI / 2, [1, 0, 0]);

    const tapaAdelanteTransf = mat4.identity(mat4.create());
    mat4.translate(tapaAdelanteTransf, tapaAdelanteTransf, [0, 0, Esfera.radio * Math.cos(Esfera.angulo)]);
    mat4.multiply(tapaAdelanteTransf, tapaAdelanteTransf, tapaAdelanteNyT);

    //calculando nuevas tangentes para la tapa de adelante
    const nuevasTanBitTapaAdelante = utils.calcularTanYBiTan(tapaAdelante)
    tapaAdelante.tangentes = nuevasTanBitTapaAdelante.tangentes

    const TapaAdelante_NEW_AUX = utils.nuevasCoordenadas(tapaAdelanteNyT, tapaAdelante, false)
    const TapaAdelante_NEW = utils.nuevasCoordenadas(tapaAdelanteTransf, tapaAdelante, false)
    TapaAdelante_NEW.normales = TapaAdelante_NEW_AUX.normales
    TapaAdelante_NEW.tangentes = TapaAdelante_NEW_AUX.tangentes

    //Tapa Atras
    const tapaAtrasNyT = mat4.identity(mat4.create());
    mat4.rotate(tapaAtrasNyT, tapaAtrasNyT, -Math.PI / 2, [1, 0, 0]);


    const tapaAtrasTransf = mat4.identity(mat4.create());
    mat4.translate(tapaAtrasTransf, tapaAtrasTransf, [0, 0, -Esfera.radio * Math.cos(Esfera.angulo)]);
    mat4.multiply(tapaAtrasTransf, tapaAtrasTransf, tapaAtrasNyT);

    //calculando nuevas tangentes para la tapa de atras
    const nuevasTanBitTapaAtras = utils.calcularTanYBiTan(tapaAtras)
    tapaAtras.tangentes = nuevasTanBitTapaAtras.tangentes


    const TapaAtras_NEW_AUX = utils.nuevasCoordenadas(tapaAtrasNyT, tapaAtras, true)
    const TapaAtras_NEW = utils.nuevasCoordenadas(tapaAtrasTransf, tapaAtras, true)
    TapaAtras_NEW.normales = TapaAtras_NEW_AUX.normales
    TapaAtras_NEW.tangentes = TapaAtras_NEW_AUX.tangentes

    /*
    * Nuevas UVs
    */
    const {columna1, _} = utils.I2(tapaAdelante.textureCoords, "noImprimir")

    const UTextureCoord = columna1.slice(0, -31)
    const VTextureCoord = [];

    VTextureCoord.push(0, 0.2)

    const newTextureCoords = []

    for (let i = 0; i < VTextureCoord.length; i++) {
        for (let j = 0; j < UTextureCoord.length; j++) {
            newTextureCoords.push(1 - UTextureCoord[j], VTextureCoord[i]);
        }
    }
    //UV tapa de atras
    const VTextureCoordAtras = [];
    const newTextureCoordsAtras = []
    VTextureCoordAtras.push(0.8, 1.0)
    for (let i = 0; i < VTextureCoordAtras.length; i++) {
        for (let j = 0; j < UTextureCoord.length; j++) {
            newTextureCoordsAtras.push(1 - UTextureCoord[j], VTextureCoordAtras[i]);
        }
    }

    //UV del cuerpo, las UV de la tapa van con v = (0,0.1), las del v del cuerpo van con v = (0.2,0.8)
    const newTextureCoordsCuerpo = []
    const newVTextureCoordsCuerpo = []

    //divide the interval [0.2, 0.8] into 20 equal parts
    const distance = 0.6 / (pasoDiscretoForma)
    for (let i = 0; i <= pasoDiscretoForma; i++) {
        newVTextureCoordsCuerpo.push(0.2 + distance * i)
    }
    for (let i = 0; i < UTextureCoord.length; i++) {
        for (let j = 0; j < newVTextureCoordsCuerpo.length; j++) {
            newTextureCoordsCuerpo.push(UTextureCoord[i], newVTextureCoordsCuerpo[j]);
        }
    }
    /*
    Indices
     */
    const cuerpo_NEW_indices = []
    const tapaAtras_NEW_indices = []
    cuerpo.indices.forEach(indice => {
        cuerpo_NEW_indices.push(indice + Math.max(...tapaAdelante.indices) + 1);

    });
    tapaAtras.indices.forEach(indice => {
        tapaAtras_NEW_indices.push(indice + Math.max(...cuerpo_NEW_indices) + 1);
    });
    /*
     * Asignacion al objeto final: esfera
     */
    //indices
    esfera.indices.push(
        ...tapaAdelante.indices, 61, 62,
        ...cuerpo_NEW_indices, 712, 713,
        ...tapaAtras_NEW_indices
    )
    //Vertices
    esfera.vertices.push(
        ...TapaAdelante_NEW.vertices,
        ...cuerpo.vertices,
        ...TapaAtras_NEW.vertices
    );
    //normales
    esfera.normales.push(
        ...TapaAdelante_NEW.normales,
        ...cuerpo.normales,
        ...TapaAtras_NEW.normales
    );
    //tangentes
    //el cuerpo no tiene transformaciones, las tapas las tienen, puede agregar las tan del cuerpo aca

    //UV
    esfera.textureCoords.push(
        ...newTextureCoords,
        ...newTextureCoordsCuerpo,
        ...newTextureCoordsAtras
    );
    //Tangentes
    const nuevasTanBitCuerpo = utils.calcularTanYBiTan(cuerpo)
    esfera.tangentes.push(
        ...TapaAdelante_NEW.tangentes,
        ...nuevasTanBitCuerpo.tangentes,
        ...TapaAtras_NEW.tangentes
    )

    //Se carga a la escena
    esfera.diffuse = colores.Textura.diffuse
    esfera.ambient = colores.Textura.ambient
    esfera.texture = "UV";
    scene.add(esfera)


}

function moduloVioleta() {
    const pasoDiscretoRecorrido = 1;
    const divisionesForma = 8
    const curvaRecorrido = new CurvaCubicaDeBezier(
        [0, 0],
        [0.666, 0],
        [1.333, 0],
        [dimensiones.profundidadModuloVioleta, 0]
    );

    const formaSuperficie = new Forma();
    //conservar el ingreso de datos, bezier, punto, bezier, punto .... IMPORTANTE PARA LAS NORMALES
    formaSuperficie.iniciarEn(1, 0.5)
        .CurvaBezierA(1, 0.8, 0.8, 1, 0.5, 1)
        .lineaA(-0.5, 1)
        .CurvaBezierA(-0.8, 1, -1, 0.8, -1, 0.5)
        .lineaA(-1, -0.5)
        .CurvaBezierA(-1, -0.8, -0.8, -1, -0.5, -1)
        .lineaA(0.5, -1)
        .CurvaBezierA(0.8, -1, 1, -0.8, 1, -0.5)
        .lineaA(1, 0.5).curvaCerrada(true)  //la ultima tangente/normal a mano


    const datosDelRecorrido = utils.crearRecorrido(pasoDiscretoRecorrido, curvaRecorrido)
    const datosDeLaForma = utils.crearForma(divisionesForma, formaSuperficie)
    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1

    const dim = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }
    //calculo de las nuevas UVTextures
    let perimetroDeLaForma = 0
    let distanciaEntrePtos = []
    let newUTexture = []

    for (let i = 0; i < datosDeLaForma.puntos.length - 1; i++) {

        const P1 = datosDeLaForma.puntos[i]
        const P2 = datosDeLaForma.puntos[(i + 1)]

        const D = Math.sqrt(Math.pow(P2[0] - P1[0], 2) + Math.pow(P2[1] - P1[1], 2))
        distanciaEntrePtos.push(D)
        perimetroDeLaForma += D

    }
    //sumar la distancia entre los puntos
    let p = 0
    newUTexture.push(0)
    distanciaEntrePtos.map(distancia => {
        p += distancia
        newUTexture.push(p / perimetroDeLaForma)
    })

    const newVTexture = []

    newVTexture.push(0, 0.5)
    const nuevasUV = []
    for (let i = 0; i < newVTexture.length; i++) {
        for (let j = 0; j < newUTexture.length; j++) {
            nuevasUV.push(1 - newUTexture[j], newVTexture[i])
        }
    }


    const moduloVioletaPS = new SuperficieParametrica1("moduloVioletaPS", datosDeLaForma, datosDelRecorrido, dim)
    const nuevasTanBitmoduloVioletaPS = utils.calcularTanYBiTan(moduloVioletaPS)

    moduloVioletaPS.tangentes = nuevasTanBitmoduloVioletaPS.tangentes
    moduloVioletaPS.textureCoords = nuevasUV
    moduloVioletaPS.diffuse = colores.Textura.diffuse
    moduloVioletaPS.ambient = colores.Textura.ambient
    moduloVioletaPS.texture = "UV";

    const moduloVioletaAnillo = Object.assign({}, moduloVioletaPS)
    moduloVioletaAnillo.alias = "moduloVioletaAnillo"

    scene.add(moduloVioletaPS)
    scene.add(moduloVioletaAnillo)
}

function cargarNucleo() {
    const dimensionesTriangulosNucleo = { //iguales a la pastilla
        filas: 1, //segmentosRadiales
        columnas: 30, //segmentosDeAltura
    };
    const nucleoPS = new Superficie(null, "nucleoPS");

    //partes
    const tubo = new Tubo('nucleoPS_tubo', dimensiones.NucleoPS, dimensionesTriangulosNucleo)
    const cilindroSup = new Cilindro('nucleoPS_cilindroSup', dimensiones.CilindroNucleoPS, dimensionesTriangulosNucleo)
    const cilindroInf = new Cilindro('nucleoPS_cilindroInf', dimensiones.CilindroNucleoPS, dimensionesTriangulosNucleo)
    const tapaSup = new Tapa('nucleoPS_tapaSup', dimensiones.CilindroNucleoPS.radioSuperior, dimensionesTriangulosNucleo)
    const tapaInf = new Tapa('nucleoPS_tapaInf', dimensiones.CilindroNucleoPS.radioSuperior, dimensionesTriangulosNucleo)
    //dimensiones para el calculo de uv
    //La u varia de acuerdo a la longitud del Cuerpo Completo
    const C1 = dimensiones.CilindroNucleoPS.radioSuperior;
    const a = dimensiones.CilindroNucleoPS.radioInferior - dimensiones.CilindroNucleoPS.radioSuperior;
    const b = dimensiones.CilindroNucleoPS.altura;
    const C2 = Math.sqrt(a * a + b * b)
    const C3 = dimensiones.NucleoPS.altura
    const L = C1 + C2 + C3 + C2 + C1
    const v = []
    //repito dos veces en las uniones, ahi tengo 2 vertices en la misma posicion
    v.push(0, C1 / L, C1 / L,
        (C1 + C2) / L, (C1 + C2) / L,
        (C1 + C2 + C3) / L, (C1 + C2 + C3) / L,
        (C1 + C2 + C3 + C2) / L, (C1 + C2 + C3 + C2) / L,
        (C1 + C2 + C3 + C2 + C1) / L)
    // console.log(v)

    const u = []
    for (let i = 0; i <= dimensionesTriangulosNucleo.columnas; i++) {
        u.unshift(i / dimensionesTriangulosNucleo.columnas)
    }
    // console.log(u)
    const nuevasUV = []
    // ...tapaSup_NEW_indices,
    // ...cilindroSup_NEW_indices,
// ...tubo.indices, (C1+C2)/L, (C1+C2+C3)/L,  -> 5,6
// ...cilindroInf_NEW_indices,
// ...tapaInf_NEW_indices
    //

    for (let i = 0; i < v.length; i++) {
        for (let j = 0; j < u.length; j++) {
            if (i === 4 || i === 5) { //arregla las texturas del tubo
                nuevasUV.push(1 - u[j], v[i])

            } else {
                nuevasUV.push(u[j], v[i])

            }
        }
    }
    // console.log(nuevasUV.length)
    // console.log(tubo.textureCoords.length + cilindroSup.textureCoords.length + tapaSup.textureCoords.length + cilindroInf.textureCoords.length + tapaInf.textureCoords.length)

    //transformaciones
    const cilidroSupTransformacion = mat4.identity(mat4.create());
    mat4.rotate(cilidroSupTransformacion, cilidroSupTransformacion, Math.PI / 2, [0, 1, 0]);
    mat4.translate(cilidroSupTransformacion, cilidroSupTransformacion, [0, dimensiones.NucleoPS.altura, 0]);
    const cilindroSupOnlyNormalsTangentsTransform = mat4.identity(mat4.create());
    mat4.rotate(cilindroSupOnlyNormalsTangentsTransform, cilindroSupOnlyNormalsTangentsTransform, Math.PI / 2, [0, 1, 0]);

    const tapaSupTransformacion = mat4.identity(mat4.create());
    mat4.translate(tapaSupTransformacion, tapaSupTransformacion, [0,
        dimensiones.NucleoPS.altura + dimensiones.CilindroNucleoPS.altura, 0]);

    const cilidroInfTransformacion = mat4.identity(mat4.create());
    mat4.rotate(cilidroInfTransformacion, cilidroInfTransformacion, -Math.PI / 2, [0, 1, 0]);
    mat4.rotate(cilidroInfTransformacion, cilidroInfTransformacion, -Math.PI, [1, 0, 0]);

    const tapaInfTransformacion = mat4.identity(mat4.create());
    mat4.rotate(tapaInfTransformacion, tapaInfTransformacion, Math.PI, [1, 0, 0]);
    mat4.translate(tapaInfTransformacion, tapaInfTransformacion, [0, dimensiones.CilindroNucleoPS.altura, 0]);
    const tapaInfOnlyNormalsTangentsTransform = mat4.identity(mat4.create());
    mat4.rotate(tapaInfOnlyNormalsTangentsTransform, tapaInfOnlyNormalsTangentsTransform, Math.PI, [1, 0, 0]);


    const tuboTransformacion = mat4.identity(mat4.create());

    const tubo_NEW = utils.nuevasCoordenadas(tuboTransformacion, tubo, true)

    const cilindroSup_NEW = utils.nuevasCoordenadas(cilidroSupTransformacion, cilindroSup, true)
    const cilindroSup_NEW_normals_tangents = utils.nuevasCoordenadas(cilindroSupOnlyNormalsTangentsTransform, cilindroSup, true)
    cilindroSup_NEW.normales = cilindroSup_NEW_normals_tangents.normales
    cilindroSup_NEW.tangentes = cilindroSup_NEW_normals_tangents.tangentes

    const tapaSup_NEW = utils.nuevasCoordenadas(tapaSupTransformacion, tapaSup)
    const cilindroInf_NEW = utils.nuevasCoordenadas(cilidroInfTransformacion, cilindroInf)

    const tapaInf_NEW = utils.nuevasCoordenadas(tapaInfTransformacion, tapaInf, true)
    const tapaInf_NEW_normals_tangents = utils.nuevasCoordenadas(tapaInfOnlyNormalsTangentsTransform, tapaInf, true)
    tapaInf_NEW.normales = tapaInf_NEW_normals_tangents.normales
    tapaInf_NEW.tangentes = tapaInf_NEW_normals_tangents.tangentes


    //indices
    const tapaSup_NEW_indices = []
    tapaSup.indices.forEach(indice => {
        tapaSup_NEW_indices.push(indice);
    });
    //tapaSup_NEW_indices.push(tapaSup_NEW_indices[tapaSup_NEW_indices.length - 1]);


    const cilindroSup_NEW_indices = []
    cilindroSup.indices.forEach(indice => {
        cilindroSup_NEW_indices.push(indice + tapaSup_NEW_indices.length);

    });

    const tubo_NEW_indices = []
    tubo.indices.forEach(indice => {
        tubo_NEW_indices.push(indice + cilindroSup_NEW_indices.length + tapaSup_NEW_indices.length);
    });

    const cilindroInf_NEW_indices = []
    cilindroInf.indices.forEach(indice => {
        cilindroInf_NEW_indices.push(indice + tubo_NEW_indices.length + cilindroSup_NEW_indices.length + tapaSup_NEW_indices.length);
    });

    const tapaInf_NEW_indices = []
    tapaInf.indices.forEach(indice => {
        tapaInf_NEW_indices.push(indice + cilindroInf_NEW_indices.length + tubo_NEW_indices.length + cilindroSup_NEW_indices.length + tapaSup_NEW_indices.length);
    });
    // repito las uniones para que se dibujen lineas y no triangulos
    nucleoPS.indices.push(
        ...tapaSup_NEW_indices, 61, 62,
        ...cilindroSup_NEW_indices, 123, 124,
        ...tubo_NEW_indices, 185, 186,
        ...cilindroInf_NEW_indices, 247, 248,
        ...tapaInf_NEW_indices
    );

    nucleoPS.vertices.push(
        ...tapaSup_NEW.vertices,
        ...cilindroSup_NEW.vertices,
        ...tubo_NEW.vertices,
        ...cilindroInf_NEW.vertices,
        ...tapaInf_NEW.vertices
    );
    nucleoPS.normales.push(
        ...tapaSup.normales, //la transformacion no afecta las normales
        ...cilindroSup_NEW.normales,
        ...tubo_NEW.normales,
        ...cilindroInf_NEW.normales,
        ...tapaInf_NEW.normales
    );

    nucleoPS.tangentes.push(
        ...tapaSup.tangentes, //la transformacion no afecta las tangentes
        ...cilindroSup_NEW.tangentes,
        ...tubo_NEW.tangentes,
        ...cilindroInf_NEW.tangentes,
        ...tapaInf_NEW.tangentes
    );
    nucleoPS.textureCoords.push(
        ...nuevasUV
    );

    nucleoPS.diffuse = colores.Textura.diffuse
    nucleoPS.ambient = colores.Textura.ambient
    nucleoPS.texture = "UV"

    //clone object nucleoPS
    const nucleoAnillo = Object.assign({}, nucleoPS);
    nucleoAnillo.alias = "nucleoAnillo";


    scene.add(nucleoPS)
    scene.add(nucleoAnillo)
}

function cargarAnillo() {

    const dimTriangulosTuboAnillo = {
        filas: 1,
        columnas: 8,
    };
    const dimensionesCilindroPastilla = {
        radioSuperior: 2.30,
        radioInferior: dimensiones.pastillas.cuerpo.radio,
        altura: 0.10,
    };
    const dimensionesTriangulosPastilla = {
        filas: 1, //segmentosRadiales
        columnas: 30, //segmentosDeAltura
    };
    //pastilla

    scene.add(new Tubo('pastillaCuerpo', dimensiones.pastillas.cuerpo, dimensionesTriangulosPastilla), {
        diffuse: colores.Pastilla,
    });
    scene.add(new Cilindro('pastillaCilindroSup', dimensionesCilindroPastilla, dimensionesTriangulosPastilla), {
        diffuse: colores.Pastilla,
    });
    scene.add(new Cilindro('pastillaCilindroInf', dimensionesCilindroPastilla, dimensionesTriangulosPastilla), {
        diffuse: colores.Pastilla,
    });
    scene.add(new Tapa('pastillaTapaSup', dimensionesCilindroPastilla.radioSuperior, dimensionesTriangulosPastilla), {
        diffuse: colores.Pastilla,
    });
    scene.add(new Tapa('pastillaTapaInf', dimensionesCilindroPastilla.radioSuperior, dimensionesTriangulosPastilla), {
        diffuse: colores.Pastilla,
    });

    //anillo y tubos interiores
    cargarTorus()
    scene.add(new Tubo('anillo_tuboH1', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))
    scene.add(new Tubo('anillo_tuboH2', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))

    scene.add(new Tubo('anillo_tuboV1', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))
    scene.add(new Tubo('anillo_tuboV2', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))

    const cantidadDeAnillosInteriores = 2 * Math.ceil(dimensiones.anillo.tubo.altura / (dimensiones.anillo.distanciaEntreTubos * 2))

    for (let i = 0; i < cantidadDeAnillosInteriores; i++) {
        scene.add(new Tubo('anillo_tuboInterior', dimensiones.anillo.tuboInterior, dimTriangulosTuboAnillo))
    }


}

function cargarTorus() {

    const dimensionesTriangulosTorus = {
        filas: 30, //segmentosTubulares   //para el deploy 30
        columnas: 80, //segmentosRadiales  //para el deploy 80
    };
    /*
    Dimensiones de la esfera
     */
    //El recorrido va ser circular con radio 0, mientras mas puntos mas se parece a
    //una circunferencia en lugar de un poligono -> tomar en cuenta para la tapa
    const pasoDiscretoRecorrido = dimensionesTriangulosTorus.columnas
    const divisionesForma = dimensionesTriangulosTorus.filas //precision en la forma,
    ///////////////////////////////////////////////////////////////////
    const porcionDeCircunferencia = 1 //la forma va de pi/4 a (pi-pi/4) -> 25% del circulo
    const radio = dimensiones.anillo.radioInterior//15.2
    //reutilizo la funcion para crear una forma circular
    const forma = utils.crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)
    //los pts me sirven, las binormales, le quito la z y son las normales
    const datosDeLaForma = {
        puntos: forma.puntos,
        normales: forma.binormales.map(punto => {
            return [
                punto[0], punto[1]]
        }),
        tangentes: forma.tangentes.map(punto => {
            return [
                punto[0], punto[1]
            ]
        }),
    }
    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensionesTorus = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }
    const datosDelRecorrido = utils.crearRecorridoCircular(dimensiones.anillo.radio, 1, dimensionesTorus["filas"])

    const torus = new SuperficieParametrica1("torus", datosDeLaForma, datosDelRecorrido, dimensionesTorus, true)

    const nuevasTexturasUV = []
    let UTexture = []
    const VTexture = []

    for (let i = 0; i <= (dimensionesTriangulosTorus.filas); i++) {
        VTexture.push(i / (dimensionesTriangulosTorus.filas))
    }

    const arrayDePuntos = []
    const divisiones = 4
    const cant_UVTexture = 19 //se copia la misma textura en el torus, se tiene (can_UVTexture +1 ) texturas
    //recordar -> para llenar el torus completo necesito 81 puntos, ya pusheo el cero, asi que el indiceU debe ser 80
    //80 = divisiones * (can_UVTexture + 1)
    //80 = 5 * (15 + 1)
    //80 = 4 * (19 + 1)
    arrayDePuntos.push(0)
    for (let j = 0; j <= cant_UVTexture; j++) {
        for (let i = 1; i <= divisiones; i++) {
            arrayDePuntos.push(i / divisiones + j)
        }
    }

    UTexture.push(
        ...arrayDePuntos
    )

    for (let i = 0; i < UTexture.length; i++) {
        for (let j = 0; j < VTexture.length; j++) {
            nuevasTexturasUV.push(UTexture[i], VTexture[j])
        }
    }
    (torus.textureCoords.length !== nuevasTexturasUV.length) ? console.error("Distintas cantidades de texturas") : null

    torus.textureCoords = nuevasTexturasUV;

    const nuevasTanBitCuerpo = utils.calcularTanYBiTan(torus)
    torus.tangentes = nuevasTanBitCuerpo.tangentes

    //Se carga a la escena
    torus.diffuse = colores.Textura.diffuse
    torus.ambient = colores.Textura.ambient
    torus.texture = "torus"

    textureMap[torus.texture] = {
        diffuse: new Texture(gl, 'torus/diffuse.jpg'),
        normal: new Texture(gl, 'torus/normal.jpg'),
        specular: new Texture(gl, 'torus/specular.jpg'),
    }

    scene.add(torus)
}

function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    transforms.updatePerspective();
    try {
        // Iterate over every object in the scene
        scene.traverse(object => {
            if (object.hidden) return;
            // Calculate local transformations

            transforms.calculateModelView();
            transforms.push(); //pusheamos la matriz de Vista -->this.camera.getViewTransform() -->camera.matrixWorldInverse
            transformar.setAlias(object.alias)
            gl.uniform1i(program.uLightSource, false); //solo las fuentes de luz tendran un color de materialDiffuse

            const light = lightsData.find(({id}) => object.alias === id);
            if (light) {

                const {position, diffuse} = lights.get(light.id);
                //talves sea mejor crear una constante con transforms.modelViewMatrix
                mat4.translate(transforms.modelViewMatrix, transforms.modelViewMatrix, position);
                object.diffuse = diffuse;
                gl.uniform1i(program.uLightSource, true);
            }

            //                   this.camera.getViewTransform() * (las distintas transformaciones a los objetos)
            // modelViewMatrix = camera.matrixWorldInverse      * object.matrixWorld
            //ahora cade vez que llamemos a transforms.modelViewMatrix * object.matrixWorld, obtenemos la matriz de modelView
            //de cada objeto, y la multiplicamos por la matriz de la camara para obtener la matriz de modelView de cada objeto

            transformar.esferaEscenario();


            //luz
            // If object is the light, we update its position
            if (object.alias === 'light') {
                const lightTransform = transforms.modelViewMatrix
                const lightPosition_ = program.getUniform(program.uLightPosition)
                mat4.translate(lightTransform, lightTransform, lightPosition_);
                mat4.scale(lightTransform, lightTransform, [0.5, 0.5, 0.5]);
            }


            //test
            if (object.alias === "planoTest1") {
                const planoTransform = transforms.modelViewMatrix
                mat4.translate(planoTransform, planoTransform, [0, 20, 0]);
                mat4.rotate(planoTransform, planoTransform, Math.PI / 2, [1, 0, 0])

            } else if (object.alias === 'cubeComplexTest') {
                const cubeTransform = transforms.modelViewMatrix
                // mat4.scale(cubeTransform, cubeTransform, [15, 15, 15]);
            }


            //cubmaps
            if (object.alias === "cubeMap") {
                const cubeMapTransform = transforms.modelViewMatrix;
                const factor = 2048 * 2;
                mat4.scale(cubeMapTransform, cubeMapTransform, [factor, factor, factor]);
                mat4.rotate(cubeMapTransform, cubeMapTransform, Math.PI, [1, 0, 0]);
            }


            //Actualizo el wireframe
            if (object.alias !== 'floor' && object.alias !== 'axis') {
                object.wireframe = wireframe;
            }
            // Ubico las partes de la nave en la escena

            //Dependiendo del objeto se aplica la transformacion
            if (object.alias === 'nave') {
                Nave.naveTransform = transforms.modelViewMatrix;
                /*
                const radio = 45
                const factorVelocidad = 60;
                const phi = 2*Math.PI * posicionAnillo/factorVelocidad
                const x = radio * Math.sin(phi)
                const z = radio * Math.cos(phi)
                const target = [x, 0, z]
                mat4.translate(Nave.naveTransform, Nave.naveTransform,  target);

                //que la nave gire conforme la tangente del recorrido target
                mat4.rotate(Nave.naveTransform, Nave.naveTransform, phi + Math.PI/2, [0,1,0]);


                 */

                targetNave = [0, 0, 0] //es el vector de posicion de la nave resultante de una futura matriz de transformacion

                //los paneles solares son relativos a la nave, los configuro tambien ahora.
                targetPanelesSolares = [0, 0, 15.5];//[0,0,dimensiones.panelSolar.tuboPrincipal.altura]                    //10.15

                //actualizo el foco de la camara en los controles, evita un parpadeo
                //cunado cambio las camaras, los target no se mueven pero en el futuro podrian hacerlo
                controles.setFocus(targetNave, targetPanelesSolares)

                if (controles.focusCamera.Nave === true) {
                    camera.setFocus(targetNave)
                } else if (controles.focusCamera.PanelesSolares === true) {
                    camera.setFocus(targetPanelesSolares)
                }


                /*

                                //obtener la posicion de Nave.naveTransform respecto al mundo
                                const posicionNave = vec3.create();
                                vec3.transformMat4(posicionNave, [0,0,0], Nave.naveTransform);
                                //log posicionNave con 2 decimales en x, y z
                                console.log(`posNave: ${posicionNave[0].toFixed(2)}, ${posicionNave[1].toFixed(2)}, ${posicionNave[2].toFixed(2)}`);

                                //obtener la posiciones de la transformacion de la camara respecto al mundo
                                const posicionCamara = vec3.create();
                                vec3.transformMat4(posicionCamara, [0,0,0], camera.getViewTransform());
                                //log posicionCamara con 2 decimales en x, y z
                                console.log(`posCamara: ${posicionCamara[0].toFixed(2)}, ${posicionCamara[1].toFixed(2)}, ${posicionCamara[2].toFixed(2)}`);

                 */
            }
            //////////////////////////////////////////////////////////
            transformar.luna()

            transformar.tierra()

            transformar.nucleoDelPanelSolar()

            transformar.panelesSolares()

            transformar.nucleoDelAnillo()

            transformar.anillo()

            transformar.bloques()

            transformar.modulosVioleta()

            transformar.esfera()

            transformar.capsula()


            ///////////////////////////////////////////
            transforms.setMatrixUniforms();
            transforms.pop();

            //para actualizar la posicion de la luz en la escena
            gl.uniform3fv(program.uLightPosition, lights.getArray('position'));


            // Originalmente transforms.modelViewMatrix es la matriz de vista.
            // Se la pusheo para guardarla , ahora al multiplicar transforms.modelViewMatrix por las matrices de
            // transformacion de los objetos se convierte en la ModelViewMatrix y se la manda a la uniform correspondiente
            // ahora se popea para que vuelva a ser la matriz de vista.
            // const viewMatrix = camera.getViewTransform() //alternativamente-------->es la de vista
            gl.uniformMatrix4fv(program.uViewMatrix, false, transforms.modelViewMatrix);
            // const posicionCamara = Array.from(camera.cameraPositionCoordDelMundo)
            // console.log(`posCamara: ${posicionCamara[0].toFixed(2)}, ${posicionCamara[1].toFixed(2)}, ${posicionCamara[2].toFixed(2)}`);

            dibujarMallaDeObjeto(object)

        });
        //se resetea para el siguiente frame
        Bloques.posicionBloque = 0
        PanelesSolares.distanciaRelativaConElTuboPrincipal = 3.5
        Anillo.sentidoTuboInterior = 1
        Anillo.desplazamientoTuboInterior = 0

    } catch (error) {
        console.error(error);
    }
}

function dibujarMallaDeObjeto(object) {

    // console.log("cubeSampler",program.getUniform(program.uCubeSampler))
    // console.log("sampler",program.getUniform(program.uSampler))
    // console.log("normal",program.getUniform(program.uNormalSampler))


    gl.uniform4fv(program.uMaterialDiffuse, object.diffuse);
    gl.uniform4fv(program.uMaterialSpecular, object.specular);
    gl.uniform4fv(program.uMaterialAmbient, object.ambient);
    gl.uniform1i(program.uWireframe, object.wireframe);

    // Bind
    gl.bindVertexArray(object.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

    // Reset
    gl.uniform1i(program.uIsTheCubeMapShader, false);
    gl.uniform1i(program.uHasTexture, false);
    gl.uniform1i(program.uActivateEarthTextures, false);
    gl.uniform1i(program.uActivateSpecularTexture, false);

    //Textures
    if (object.alias === 'cubeMap') {

        gl.uniform1i(program.uIsTheCubeMapShader, true);
        // Activate cube map
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);

    } else if (object.texture) {

        gl.uniform1i(program.uHasTexture, true);

        const texture = textureMap[object.texture]

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture.diffuse.glTexture);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture.normal.glTexture);

        //si el objeto es la tierra cargamos nubes
        if (object.alias === 'tierra') {
            gl.uniform1i(program.uActivateEarthTextures, true);
            //nubes
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, textureEarthClouds.glTexture);
        }
        if (texture.specular) {
            gl.uniform1i(program.uActivateSpecularTexture, SpecularMap);
            //specular
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, texture.specular.glTexture);
        }
    }
    // Draw
    if (object.wireframe) { //piso y axis con con gl.LINES

        if (object.alias === 'floor' || object.alias === 'axis') {
            gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.uniform4fv(program.uMaterialDiffuse, colores.RojoMetalico);
            gl.drawElements(gl.LINE_STRIP, object.indices.length, gl.UNSIGNED_SHORT, 0);
        }

    } else {
        const tipoDeDibujo = (triangleStrip) ? gl.TRIANGLE_STRIP : gl.TRIANGLES;
        if (object.alias === 'cubeMap') {
            gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
        } else
            gl.drawElements(tipoDeDibujo, object.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

}

function animate() {
    transformar.animarAnillo(dxAnillo)
    draw();
}

animationRate = 30

function onFrame() {
    elapsedTime = (new Date).getTime() - initialTime;
    if (elapsedTime < animationRate) return; //no me sirve, intente de nuevo

    let steps = Math.floor(elapsedTime / animationRate);
    while (steps > 0) {
        animate();
        steps -= 1;
    }

    initialTime = (new Date).getTime();
}

function render() {
    initialTime = new Date().getTime();
    setInterval(onFrame, animationRate / 1000);
}

function init() {
    configure();
    cargarTexturas();
    load();
    render();
    initControls();
}

window.onload = init;

function initControls() {
    utils.configureControls({
            /*
                    'Camera Type': {
                        value: camera.type,
                        options: [Camera.ORBITING_TYPE, Camera.TRACKING_TYPE],
                        onChange: v => {
                           camera.goHome();
                            camera.setType(v);
                        }
                    },




   'PanelesSolares': {
                'Filas': {
                    value: panelSolar.cantidadDeFilas,
                    min: 1, max: 10, step: 1,
                    onChange: v => {
                        panelSolar.removerPanelesSolares(); //remuevo todos los actuales
                        panelSolar.cantidadDeFilas = v; //nuevo valor
                        panelSolar.cambiarAlturaDelTuboPrincipal() //actualizo con el nuevo valor
                        //evita el parpadeo de la camara
                        // ahora uso un foco estatico
                        //targetPanelesSolares =  [0,0,dimensiones.panelSolar.tuboPrincipal.altura]
                        //if(controles.focusCamera.PanelesSolares === true){
                        //    camera.setFocus(targetPanelesSolares)
                        //}


                        panelSolar.cargarPanelesSolares();
                    }
                },
                'Angulo': {
                    value: transformar.panelSolar.anguloRotacion,
                    min: 0, max: 360, step: 1,
                    onChange: v => transformar.panelSolar.anguloRotacion = v,
                },
                'AnimarPaneles': {
                    value: transformar.panelSolar.animar,
                    onChange: v => transformar.panelSolar.animar = v
                },
            },











    */
            /*
             'Bloques': {
                 value: bloque.type,
                 options: [Bloque.BLOQUES_4, Bloque.BLOQUES_5, Bloque.BLOQUES_6, Bloque.BLOQUES_7, Bloque.BLOQUES_8],
                 onChange: v => {
                     bloque.setType(v);
                 }
             },

             */

            ...lightsData.reduce((controls, light) => {
                const positionKeys = [
                    `X - ${light.name}`,
                    `Y - ${light.name}`,
                    `Z - ${light.name}`
                ];
                controls[light.name] = positionKeys.reduce((positionControls, position, i) => {
                    positionControls[position] = {
                        value: light.position[i],
                        min: -30, max: 30, step: 0.1,
                        onChange: (v, state) => {
                            lights.get(light.id).position = positionKeys.map(p => state[p]);
                        }
                    };
                    return positionControls;
                }, {});
                return controls;
            }, {}),
            'Penumbra': {
                value: lightLerpOuterCutOff,
                min: 0, max: 1, step: 0.01,
                onChange: v => gl.uniform1f(program.uLerpOuterCutOff, v)
            },
            'Angulo': {
                value: lightOuterCutOff,
                min: 0, max: 60, step: 0.1,
                onChange: v => gl.uniform1f(program.uOuterCutOff, v)
            },
            'LuzDistancia': {
                value: lightRadius / 20.0,
                min: 0.01, max: 10.0, step: 1.0,
                onChange: v => gl.uniform1f(program.uLightRadius, v * 20.0)
            },
            'Decay': {
                value: lightDecay,
                min: 0.01, max: 1.0, step: 0.001,
                onChange: v => {
                    // const value = -0.4 * Math.log(1.004-v);

                    gl.uniform1f(program.uLightDecay, v)
                }
            },
            'azimuth': {
                value: lightAzimuth,
                min: 0, max: 360, step: 1,
                onChange: v => {
                    spotLightDir.cambiarAzimuth(null,v)

                }
            },
            'elevation': {
                value: lightElevation,
                min: 0, max: 360, step: 1,
                onChange: v => {
                    spotLightDir.cambiarElevation(null,v)
                }
            },


            /*
                        'Exponent Factor': {
                            value: exponentFactor,
                            min: 1, max: 100, step: 0.01,
                            onChange: v => gl.uniform1f(program.uExponentFactor, v)
                        },


             */

            /*
                        'Light Color': {
                            value: utils.denormalizeColor(sunLightColor),
                            onChange: v => gl.uniform4fv(program.uLightDiffuse, utils.normalizeColor(v))
                        },

             */
            'Light Ambient Term': {
                value: lightAmbient[0],
                min: 0, max: 1, step: 0.01,
                onChange: v => gl.uniform4fv(program.uLightAmbient, [v, v, v, 1])
            },
            'Light Specular Term': {
                value: lightSpecular[0],
                min: 0, max: 1, step: 0.01,
                onChange: v => gl.uniform4fv(program.uLightSpecular, [v, v, v, 1])
            },
            'MinLambertTerm': {
                value: minLambertTerm,
                min: 0.0, max: 0.25, step: 0.01,
                onChange: v => gl.uniform1f(program.uMinLambertTerm, v)
            },
            'LuzSolar': {
                value: luzSolarEncendida,
                // min: -2.0, max: 2.0, step: 0.1,
                onChange: v => {
                    gl.uniform1i(program.uLuzSolarEncendida, v);

                }
            },
            'CubeMap': {
                value: cubeMapInScene,
                onChange: v => {
                    cubeMapInScene = v
                    CubeTexture.hidden = !v;
                }
            },


            /*
                        'Static Light Position': {
                            value: fixedLight,
                            onChange: v => fixedLight = v
                        },

             */
            'SpecularMap': {
                value: SpecularMap,
                // min: -2.0, max: 2.0, step: 0.1,
                onChange: v => {
                    SpecularMap = v;
                    // gl.uniform1f(program.uAjuste, v)
                }
            },
            'Wireframe': () => {
                wireframe = !wireframe;
            },
            'Triangle Strip': {
                value: triangleStrip,
                onChange: v => triangleStrip = v
            },
        }, {closed: false}
    );
}

/*
function initControls1() {
    utils.configureControls({
        'Light Color': {
            value: utils.denormalizeColor(lightColor),
            onChange: v => gl.uniform4fv(program.uLightDiffuse, utils.normalizeColor(v))
        },

        'Go Home': () => camera.goHome(),

         ...['Earth X', 'Earth Y', 'Earth Z'].reduce((result, name, i) => {
                result[name] = {
                    value: dimensiones.ajusteTierra.coordenadas[i],
                    min: -2500, max: 2500, step: 1,
                    onChange(v, state) {
                        const nuevasCoord = [
                            state['Earth X'],
                            state['Earth Y'],
                            state['Earth Z']
                        ]
                        dimensiones.ajusteTierra.coordenadas = nuevasCoord;
                    }
                };
                return result;
            }, {}),
            ...['Earth RX', 'Earth RY', 'Earth RZ'].reduce((result, name, i) => {
                result[name] = {
                    value: dimensiones.ajusteTierra.rotacion[i],
                    min: 0, max: 2 * Math.PI, step: 0.01,
                    onChange(v, state) {
                        const nuevasCoord = [
                            state['Earth RX'],
                            state['Earth RY'],
                            state['Earth RZ']
                        ]
                        dimensiones.ajusteTierra.rotacion = nuevasCoord;
                    }
                };
                return result;
            }, {}),

            'RadioTierra': {
                value: dimensiones.ajusteTierra.radio,
                min: 0, max: 2000, step: 1,
                onChange: v => dimensiones.ajusteTierra.radio = v,
            },


            ...['Luna X', 'Luna Y', 'Luna Z'].reduce((result, name, i) => {
                result[name] = {
                    value: dimensiones.ajusteLuna.coordenadas[i],
                    min: -2500, max: 2500, step: 1,
                    onChange(v, state) {
                        const nuevasCoord = [
                            state['Luna X'],
                            state['Luna Y'],
                            state['Luna Z']
                        ]
                        dimensiones.ajusteLuna.coordenadas = nuevasCoord;
                    }
                };
                return result;
            }, {}),
            ...['Luna RX', 'Luna RY', 'Luna RZ'].reduce((result, name, i) => {
                result[name] = {
                    value: dimensiones.ajusteLuna.rotacion[i],
                    min: 0, max: 2 * Math.PI, step: 0.01,
                    onChange(v, state) {
                        const nuevasCoord = [
                            state['Luna RX'],
                            state['Luna RY'],
                            state['Luna RZ']
                        ]
                        dimensiones.ajusteLuna.rotacion = nuevasCoord;
                    }
                };
                return result;
            }, {}),

            'RadioLuna': {
                value: dimensiones.ajusteLuna.radio,
                min: 0, max: 1000, step: 1,
                onChange: v => dimensiones.ajusteLuna.radio = v,
            },

        'Light Ambient Term': {
            value: lightAmbient[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uLightAmbient, [v, v, v, 1])
        },
        'Light Specular Term': {
            value: lightSpecular[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uLightSpecular, [v, v, v, 1])
        },
        ...['Translate X', 'Translate Y', 'Translate Z'].reduce((result, name, i) => {
                result[name] = {
                    value: lightPosition[i],
                    min: -50, max: 50, step: 0.1,
                    onChange(v, state) {
                        gl.uniform3fv(program.uLightPosition, [
                            state['Translate X'],
                            state['Translate Y'],
                            state['Translate Z']
                        ]);
                    }
                };
                return result;
            }, {}),


        // Spread all values from the reduce onto the controls
        ...['Translate X', 'Translate Y', 'Translate Z'].reduce((result, name, i) => {
            result[name] = {
                value: lightDirection[i],
                min: -10, max: 10, step: -0.1,
                onChange(v, state) {
                    gl.uniform3fv(program.uLightDirection, [
                        -state['Translate X'],
                        -state['Translate Y'],
                        state['Translate Z']
                    ]);
                }
            };
            return result;
        }, {}),
        'Sphere Color': {
            value: utils.denormalizeColor(materialDiffuse),
            onChange: v => gl.uniform4fv(program.uMaterialDiffuse, utils.normalizeColor(v))
        },
        'Material Ambient Term': {
            value: materialAmbient[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uMaterialAmbient, [v, v, v, 1])
        },
        'Material Specular Term': {
            value: materialSpecular[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uMaterialSpecular, [v, v, v, 1])
        },
        Shininess: {
            value: shininess,
            min: 0, max: 50, step: 0.1,
            onChange: v => gl.uniform1f(program.uShininess, v)
        },
        Background: {
            value: utils.denormalizeColor(clearColor),
            onChange: v => gl.clearColor(...utils.normalizeColor(v), 1)
        },
        Wireframe: {
            value: wireframe,
            onChange: v => wireframe = v
        }
    });
}

 */