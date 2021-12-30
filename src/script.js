'use strict';
import './style.css'
import './toastr.css'

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
import {DireccionSpotLight, Light, LightsManager} from "./js/Light";
import {TextureLoader} from "./js/TextureLoader.js";
import CubeTexture from './geometries/cube-texture.json5'
import Sphere from './geometries/sphere.json5'
import {CubeMap} from "./js/CubeMap";


let
    gl, scene, program, camera, transforms, transformar, bloque, panelSolar, controles, droneCam,
    targetNave, targetPanelesSolares, //focus de la nave y los paneles en el cual se enfoca la camara
    elapsedTime, initialTime,
    triangleStrip = true,
    wireframe = false,
    sunLightColor, lightAmbient, lightSpecular,
    lights,
    SpecularMap = true,//8.0,  //para ajustar posiciones de los objetos, se usa en el diseño
    dxAnillo = 0.01,
    lightsData = [],
    lightLerpOuterCutOff = 1,//0.5
    lightOuterCutOff = 13.5,//38
    lightRadius = 100.0,
    lightDecay = 1,
    spotLightDir,
    minLambertTerm = 0.1,
    cubeMapInScene = true,
    luzSolarEncendida = true,
    luzSpotLightEncendida = true,
    lightAzimuth,
    textureLoader,
    cubeMap,
    lightElevation,
    scaleLights = [0.1, 0.26, 0.18],
    animationRate; //ms


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
        'uLightRadius',
        'uLightDecay',
        'uMinLambertTerm',
        'uLuzSolarEncendida',
        'uLuzSpotLightEncendida'
    ];

    // Load attributes and uniforms
    program.load(attributes, uniforms);

    // Configure `scene`
    scene = new Scene(gl, program);

    // Configure `camera` and `controls`
    camera = new Camera(Camera.ORBITING_TYPE, 70, 0);
    camera.goTo([0, 0, 16], 0, -30, [0, 0, 0])
    lights = new LightsManager();
    spotLightDir = new DireccionSpotLight(lights);
    droneCam = new DroneCameraControl([0, 0, -10], camera, spotLightDir); //intialPos: [0,0,-10]
    //Luz SpotLight


    controles = new Controls(camera, canvas, droneCam, spotLightDir);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);

    //Bloques del anillo
    bloque = new Bloque(dimensiones.anillo.radio, scene)

    const intervaloEnGrados = 30; //cada 15,30, 45, 60, 75, 90 grados del giro del anillo
    //Transformaciones afines

    transformar = new TransformacionesAfin(transforms, droneCam, controles, camera, bloque,
        new AnimacionPanelesSolares(300, intervaloEnGrados), lights, spotLightDir
    );
}

function cargarTexturasLuces() {

    //CubeMap
    cubeMap = new CubeMap(gl);

    //cada vez que empieza el programa, elige aleatoriamente un set de texturas para el cubemap
    let random = Math.floor(Math.random() * 3);
    transformar.tierraLunaEnElMundo(random) //seteo transformaciones predeterminadas
    sunLightColor = utils.normalizeColor(colores.sunLightColor[random])

    // Lights data
    const spotLights = Capsula.spotLights;
    lightsData = [
        {
            id: 'sunLight', name: 'Luz solar',
            position: dimensiones.lightPosition[random],
            diffuse: sunLightColor,
            direction: dimensiones.lightPosition[random] //la luz solar no tiene direccion, este valor no se termina usando
        },
        {
            id: 'greenLight', name: 'Green Light',
            position: spotLights.green.position, diffuse: spotLights.green.diffuse, direction: spotLights.direction
        },
        {
            id: 'redLight', name: 'Red Light',
            position: spotLights.red.position, diffuse: spotLights.red.diffuse, direction: spotLights.direction
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
    lightAzimuth = spotLightDir.azimuth;
    lightElevation = spotLightDir.elevation;

    //para todas las luces
    lightAmbient = [0.1, 0.1, 0.1, 1.0];
    lightSpecular = [1.0, 1.0, 1.0, 1.0];

    gl.uniform3fv(program.uLightPosition, lights.getArray('position'));
    gl.uniform3fv(program.uLightDirection, lights.getArray('direction'));
    gl.uniform4fv(program.uLightDiffuse, lights.getArray('diffuse'));

    gl.uniform1i(program.uLuzSolarEncendida, luzSolarEncendida);
    gl.uniform1i(program.uLuzSpotLightEncendida, spotLightDir.luzSpotLightEncendida);


    gl.uniform4fv(program.uLightAmbient, lightAmbient);
    gl.uniform4fv(program.uLightSpecular, lightSpecular);
    gl.uniform1f(program.uShininess, 230.0);


    gl.uniform1f(program.uOuterCutOff, lightOuterCutOff);
    gl.uniform1f(program.uLerpOuterCutOff, lightLerpOuterCutOff);
    gl.uniform1f(program.uLightRadius, lightRadius);
    gl.uniform1f(program.uLightDecay, lightDecay);
    gl.uniform1f(program.uMinLambertTerm, minLambertTerm);

    cubeMap.cargarTexturasCubemap(random);

    // Textures
    textureLoader = new TextureLoader(gl);

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

// Se carga todos los objetos a la escena
function load() {
    // scene.add(new Floor(80, 1));
    // scene.add(new Axis(82));

    // cargarEscenario();


    //CubeMaps
    scene.add(CubeTexture, {alias: "cubeMap"});
    //Estacion Espacial
    scene.add(new Superficie(null, 'nave'))
    cargarNucleo()
    panelSolar = new PanelSolar(scene);
    panelSolar.cargarPanelesSolares()
    cargarAnillo()
    bloque.setType(Bloque.BLOQUES_4);
    moduloVioleta()
    cargarEsfera()

    cargarCapsula()
    //luces puntual y las dos spotlight
    lightsData.forEach(({id, diffuse}) => {
        const SphereClone = Object.assign({}, Sphere);
        if (id === 'sunLight')
            SphereClone.hidden = true; //escondo el objeto de la luz solar, solo sire para debug
        SphereClone.alias = id;
        SphereClone.diffuse = diffuse;
        scene.add(SphereClone);
    });
    //Planetas
    cargarALaLuna()
    cargarALaTierra()
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

    luna.texture = 'luna'
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
        filas: 90,
        columnas: 90,
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
    const pasoDiscretoRecorrido = 60
    const divisionesForma = 16 //precision en la forma,
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

    ///////////////////////////////////CAPSULA//////////////////////////////////////////////
    const capsula = new Superficie(null, 'capsula')

    //CilindroA
    Capsula.CilAaltura = 0.1
    const capsulaCuerpoCilindroA = (new Cilindro('capsulaCuerpoCilindroA', {
        radioSuperior: 0.4,
        radioInferior: 1.2,
        altura: Capsula.CilAaltura,
    }, dimensionesCapsulaCilindro))
    //CilindroB
    const capsulaCuerpoCilindroB = (new Cilindro('capsulaCuerpoCilindroB', {
        radioSuperior: 1.2,
        radioInferior: 1.5,
        altura: 0.2,
    }, dimensionesCapsulaCilindro))
    //Cuerpo
    const cuerpo = new SuperficieParametrica("capsulaCuerpoBezierA", datosDeLaFormaCuerpo, datosDelRecorrido, dimensionesCuerpo, true)
    //CilindroC
    const capsulaCuerpoCilindroC = (new Cilindro('capsulaCuerpoCilindroC', {
        radioSuperior: 0.7,
        radioInferior: 0.6,
        altura: 0.01,
    }, dimensionesCapsulaCilindro))
    //CilindroD
    const capsulaCuerpoCilindroD = (new Cilindro('capsulaCuerpoCilindroD', {
        radioSuperior: 0.6,
        radioInferior: 0.4,
        altura: 2.9 - 2.51,
    }, dimensionesCapsulaCilindro))

    //CilindroE
    const capsulaCuerpoCilindroE = (new Cilindro('capsulaCuerpoCilindroE', {
        radioSuperior: 0.4,
        radioInferior: 0,
        altura: 0.001,
    }, dimensionesCapsulaCilindro))
    /*
     * Transformaciones
     */
    //Cilindro A
    const cilindroATyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroATyN, cilindroATyN, -Math.PI / 2, [1, 0, 0]);

    const cilindroATransf = mat4.identity(mat4.create());
    mat4.translate(cilindroATransf, cilindroATransf, [0, 0, 0.1]);
    mat4.multiply(cilindroATransf, cilindroATransf, cilindroATyN);

    const nuevasTanBitCilindroA = utils.calcularTanYBiTan(capsulaCuerpoCilindroA)
    capsulaCuerpoCilindroA.tangentes = nuevasTanBitCilindroA.tangentes

    const cilindroA_NEW_AUX = utils.nuevasCoordenadas(cilindroATyN, capsulaCuerpoCilindroA, false)
    const cilindroA_NEW = utils.nuevasCoordenadas(cilindroATransf, capsulaCuerpoCilindroA, false)
    cilindroA_NEW.normales = cilindroA_NEW_AUX.normales
    cilindroA_NEW.tangentes = cilindroA_NEW_AUX.tangentes

    //Cilindro B
    const cilindroBTyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroBTyN, cilindroBTyN, -Math.PI / 2, [1, 0, 0]);

    const cilindroBTransf = mat4.identity(mat4.create());
    mat4.translate(cilindroBTransf, cilindroBTransf, [0, 0, 0.3]);
    mat4.multiply(cilindroBTransf, cilindroBTransf, cilindroBTyN);

    const nuevasTanBitCilindroB = utils.calcularTanYBiTan(capsulaCuerpoCilindroB)
    capsulaCuerpoCilindroB.tangentes = nuevasTanBitCilindroB.tangentes

    const cilindroB_NEW_AUX = utils.nuevasCoordenadas(cilindroBTyN, capsulaCuerpoCilindroB, false)
    const cilindroB_NEW = utils.nuevasCoordenadas(cilindroBTransf, capsulaCuerpoCilindroB, false)
    cilindroB_NEW.normales = cilindroB_NEW_AUX.normales
    cilindroB_NEW.tangentes = cilindroB_NEW_AUX.tangentes

    //Cuerpo
    const cuerpoTyN = mat4.identity(mat4.create());
    mat4.rotate(cuerpoTyN, cuerpoTyN, Math.PI / 2, [0, 0, 1]);

    const nuevasTanBitCuerpo = utils.calcularTanYBiTan(cuerpo)
    cuerpo.tangentes = nuevasTanBitCuerpo.tangentes

    const cuerpo_NEW = utils.nuevasCoordenadas(cuerpoTyN, cuerpo, false)

    //CilindroC
    const cilindroCTyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroCTyN, cilindroCTyN, -Math.PI / 2, [1, 0, 0]);

    const cilindroCTransf = mat4.identity(mat4.create());
    mat4.translate(cilindroCTransf, cilindroCTransf, [0, 0, 2.51]);
    mat4.multiply(cilindroCTransf, cilindroCTransf, cilindroCTyN);

    const nuevasTanBitCilindroC = utils.calcularTanYBiTan(capsulaCuerpoCilindroC)
    capsulaCuerpoCilindroC.tangentes = nuevasTanBitCilindroC.tangentes

    const cilindroC_NEW_AUX = utils.nuevasCoordenadas(cilindroCTyN, capsulaCuerpoCilindroC, false)
    const cilindroC_NEW = utils.nuevasCoordenadas(cilindroCTransf, capsulaCuerpoCilindroC, false)
    cilindroC_NEW.normales = cilindroC_NEW_AUX.normales
    cilindroC_NEW.tangentes = cilindroC_NEW_AUX.tangentes

    //CilindroD
    const cilindroDTyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroDTyN, cilindroDTyN, -Math.PI / 2, [1, 0, 0]);

    const cilindroDTransf = mat4.identity(mat4.create());
    mat4.translate(cilindroDTransf, cilindroDTransf, [0, 0, 2.9]);
    mat4.multiply(cilindroDTransf, cilindroDTransf, cilindroDTyN);

    const nuevasTanBitCilindroD = utils.calcularTanYBiTan(capsulaCuerpoCilindroD)
    capsulaCuerpoCilindroD.tangentes = nuevasTanBitCilindroD.tangentes

    const cilindroD_NEW_AUX = utils.nuevasCoordenadas(cilindroDTyN, capsulaCuerpoCilindroD, false)
    const cilindroD_NEW = utils.nuevasCoordenadas(cilindroDTransf, capsulaCuerpoCilindroD, false)
    cilindroD_NEW.normales = cilindroD_NEW_AUX.normales
    cilindroD_NEW.tangentes = cilindroD_NEW_AUX.tangentes

    //CilindroE
    const cilindroETyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroETyN, cilindroETyN, -Math.PI / 2, [1, 0, 0]);

    const cilindroETransf = mat4.identity(mat4.create());
    mat4.translate(cilindroETransf, cilindroETransf, [0, 0, (2.9 + 0.001)]);
    mat4.multiply(cilindroETransf, cilindroETransf, cilindroETyN);

    const nuevasTanBitCilindroE = utils.calcularTanYBiTan(capsulaCuerpoCilindroE)
    capsulaCuerpoCilindroE.tangentes = nuevasTanBitCilindroE.tangentes

    const cilindroE_NEW_AUX = utils.nuevasCoordenadas(cilindroETyN, capsulaCuerpoCilindroE, false)
    const cilindroE_NEW = utils.nuevasCoordenadas(cilindroETransf, capsulaCuerpoCilindroE, false)
    cilindroE_NEW.normales = cilindroE_NEW_AUX.normales
    cilindroE_NEW.tangentes = cilindroE_NEW_AUX.tangentes
    /*
     * Nuevas UV texture
     */

    const uvVectorCilA = utils.I2(capsulaCuerpoCilindroA.textureCoords, 'noImprimir')

    const V_CIL_A = [];
    V_CIL_A.push(0.1, 0)
    const V_CIL_B = [];
    V_CIL_B.push(0.2, 0.1)
    const V_CIL_C = [];
    V_CIL_C.push(0.82, 0.8)
    const V_CIL_D = [];
    V_CIL_D.push(0.9, 0.82)
    const V_CIL_E = [];
    V_CIL_E.push(1.0, 0.9)

    const newUVCilindroA = []
    const newUVCilindroB = []
    const newUVCilindroC = []
    const newUVCilindroD = []
    const newUVCilindroE = []
    //en la columna se repite el set dos veces
    const U_LENGTH = uvVectorCilA.columna1.length / 2
    const new_U_4Texturas = utils.crearVectorEntre(4.0, 0.0, U_LENGTH)

    for (let i = 0; i < V_CIL_A.length; i++) {
        for (let j = 0; j < U_LENGTH; j++) {
            newUVCilindroA.push(new_U_4Texturas[j], V_CIL_A[i])
            newUVCilindroB.push(new_U_4Texturas[j], V_CIL_B[i])
            newUVCilindroC.push(new_U_4Texturas[j], V_CIL_C[i])
            newUVCilindroD.push(new_U_4Texturas[j], V_CIL_D[i])
            newUVCilindroE.push(new_U_4Texturas[j], V_CIL_E[i])
        }
    }
    //Cuerpo Textures
    const newUVCuerpo = []
    const V_CUERPO = utils.crearVectorEntre(0.8, 0.2, divisionesForma + 1)

    for (let i = 0; i < U_LENGTH; i++) {
        for (let j = 0; j < V_CUERPO.length; j++) {
            newUVCuerpo.push(1 - new_U_4Texturas[i], V_CUERPO[j])
        }
    }
    /*
     * Asignando propiedades a la capsula
     */
    //indices
    const cilindroB_NEW_indices = []
    capsulaCuerpoCilindroB.indices.forEach(indice => {
        cilindroB_NEW_indices.push(indice + capsulaCuerpoCilindroA.indices[capsulaCuerpoCilindroA.indices.length - 1] + 1);
    });
    const cuerpo_NEW_indices = []
    cuerpo.indices.forEach(indice => {
        cuerpo_NEW_indices.push(indice + cilindroB_NEW_indices[cilindroB_NEW_indices.length - 1] + 1);
    });
    const cilindroC_NEW_indices = []
    capsulaCuerpoCilindroC.indices.forEach(indice => {
        cilindroC_NEW_indices.push(indice + cuerpo_NEW_indices[cuerpo_NEW_indices.length - 1] + 1);
    });
    const cilindroD_NEW_indices = []
    capsulaCuerpoCilindroD.indices.forEach(indice => {
        cilindroD_NEW_indices.push(indice + cilindroC_NEW_indices[cilindroC_NEW_indices.length - 1] + 1);
    });
    const cilindroE_NEW_indices = []
    capsulaCuerpoCilindroE.indices.forEach(indice => {
        cilindroE_NEW_indices.push(indice + cilindroD_NEW_indices[cilindroD_NEW_indices.length - 1] + 1);
    });
    capsula.indices.push(
        ...capsulaCuerpoCilindroA.indices, capsulaCuerpoCilindroA.indices[capsulaCuerpoCilindroA.indices.length - 1], cilindroB_NEW_indices[0], //121,122
        ...cilindroB_NEW_indices, cilindroB_NEW_indices[cilindroB_NEW_indices.length - 1], cuerpo_NEW_indices[0], //243,244
        ...cuerpo_NEW_indices, cuerpo_NEW_indices[cuerpo_NEW_indices.length - 1], cilindroC_NEW_indices[0],
        ...cilindroC_NEW_indices, cilindroC_NEW_indices[cilindroC_NEW_indices.length - 1], cilindroD_NEW_indices[0],
        ...cilindroD_NEW_indices, cilindroD_NEW_indices[cilindroD_NEW_indices.length - 1], cilindroE_NEW_indices[0],
        ...cilindroE_NEW_indices
    )
    //Vertices
    capsula.vertices.push(
        ...cilindroA_NEW.vertices,
        ...cilindroB_NEW.vertices,
        ...cuerpo_NEW.vertices,
        ...cilindroC_NEW.vertices,
        ...cilindroD_NEW.vertices,
        ...cilindroE_NEW.vertices,
    );
    //normales
    capsula.normales.push(
        ...cilindroA_NEW.normales,
        ...cilindroB_NEW.normales,
        ...cuerpo_NEW.normales,
        ...cilindroC_NEW.normales,
        ...cilindroD_NEW.normales,
        ...cilindroE_NEW.normales,
    );
    //UV
    capsula.textureCoords.push(
        ...newUVCilindroA,
        ...newUVCilindroB,
        ...newUVCuerpo,
        ...newUVCilindroC,
        ...newUVCilindroD,
        ...newUVCilindroE,
    );
    capsula.tangentes.push(
        ...cilindroA_NEW.tangentes,
        ...cilindroB_NEW.tangentes,
        ...cuerpo_NEW.tangentes,
        ...cilindroC_NEW.tangentes,
        ...cilindroD_NEW.tangentes,
        ...cilindroE_NEW.tangentes,
    )
    //Se carga a la escena
    capsula.diffuse = colores.Textura.diffuse
    capsula.ambient = colores.Textura.ambient
    capsula.texture = "capsula";
    scene.add(capsula)
    /*
     * Cola
     */
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
    const pasoDiscretoRecorrido = 50;
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
    const UTextureCoord = utils.crearVectorEntre(3, 0, Math.floor(columna1.length / 2))
    const VTextureCoord = [];

    const limiteSuperiorCuerpo = 0.9
    const limiteInferiorCuerpo = 0.1

    VTextureCoord.push(0, limiteInferiorCuerpo)
    const newTextureCoords = []

    for (let i = 0; i < VTextureCoord.length; i++) {
        for (let j = 0; j < UTextureCoord.length; j++) {
            newTextureCoords.push(1 - UTextureCoord[j], VTextureCoord[i]);
        }
    }
    //UV tapa de atras
    const VTextureCoordAtras = [];
    const newTextureCoordsAtras = []
    VTextureCoordAtras.push(limiteSuperiorCuerpo, 1.3)
    for (let i = 0; i < VTextureCoordAtras.length; i++) {
        for (let j = 0; j < UTextureCoord.length; j++) {
            newTextureCoordsAtras.push(1 - UTextureCoord[j], VTextureCoordAtras[i]);
        }
    }

    //UV del cuerpo, las UV de la tapa van con v = (0,0.1), las del v del cuerpo van con v = (0.2,0.8)
    const newTextureCoordsCuerpo = []
    const newVTextureCoordsCuerpo = utils.crearVectorEntre(limiteSuperiorCuerpo, limiteInferiorCuerpo, pasoDiscretoForma + 1)

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
        cuerpo_NEW_indices.push(indice + tapaAdelante.indices[tapaAdelante.indices.length - 1] + 1);

    });
    tapaAtras.indices.forEach(indice => {
        tapaAtras_NEW_indices.push(indice + cuerpo_NEW_indices[cuerpo_NEW_indices.length - 1] + 1);
    });


    /*
     * Asignacion al objeto final: esfera
     */
    //indices
    esfera.indices.push(
        ...tapaAdelante.indices, 61, 62,
        ...cuerpo_NEW_indices, 712, 713,
        ...tapaAtras_NEW_indices  //-> tapa de atras donde sale la nave habilitar , para tapar la esfera
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
    esfera.texture = "esfera";
    scene.add(esfera)


}

function moduloVioleta() {
    const pasoDiscretoRecorrido = 10;
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

    // Añado puntos extras manualmente
    datosDeLaForma.puntos.splice(9, 0, [0, 1])
    datosDeLaForma.puntos.splice(19, 0, [-1, 0])
    datosDeLaForma.puntos.splice(29, 0, [0, -1])
    datosDeLaForma.puntos.splice(39, 0, [1, 0])

    datosDeLaForma.normales.splice(9, 0, [0, 1])
    datosDeLaForma.normales.splice(19, 0, [-1, 0])
    datosDeLaForma.normales.splice(29, 0, [0, -1])
    datosDeLaForma.normales.splice(39, 0, [1, 0])

    datosDeLaForma.tangentes.splice(9, 0, [-1, 0])
    datosDeLaForma.tangentes.splice(19, 0, [0, -1])
    datosDeLaForma.tangentes.splice(29, 0, [1, 0])
    datosDeLaForma.tangentes.splice(39, 0, [0, 1])

    //datosDeLaForma.puntos[9] -> datosDeLaForma.puntos[0]
    const puntosRecorridos = []
    const normalesRecorridas = []
    const tangentesRecorridas = []

    for (let i = 9; i < datosDeLaForma.puntos.length - 1; i++) {
        puntosRecorridos.push(datosDeLaForma.puntos[i])
        normalesRecorridas.push(datosDeLaForma.normales[i])
        tangentesRecorridas.push(datosDeLaForma.tangentes[i])
    }
    for (let i = 0; i < 9; i++) {
        puntosRecorridos.push(datosDeLaForma.puntos[i])
        normalesRecorridas.push(datosDeLaForma.normales[i])
        tangentesRecorridas.push(datosDeLaForma.tangentes[i])
    }
    puntosRecorridos.push(puntosRecorridos[0])
    normalesRecorridas.push(normalesRecorridas[0])
    tangentesRecorridas.push(tangentesRecorridas[0])

    datosDeLaForma.puntos = puntosRecorridos
    datosDeLaForma.normales = normalesRecorridas
    datosDeLaForma.tangentes = tangentesRecorridas


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
        newUTexture.push(p / (perimetroDeLaForma / 4))
    })


    const newVTexture = [];

    for (let i = 0; i < dim.columnas; i++) {
        newVTexture.push(i / dim.filas)
    }

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

    moduloVioletaPS.texture = "moduloVioleta"

    const moduloVioletaAnillo = Object.assign({}, moduloVioletaPS)
    moduloVioletaAnillo.alias = "moduloVioletaAnillo"

    scene.add(moduloVioletaPS)
    scene.add(moduloVioletaAnillo)
}

function cargarNucleo() {
    const dimensionesTriangulosNucleo = { //iguales a la pastilla
        filas: 16, //segmentosRadiales
        columnas: 50, //segmentosDeAltura
    };
    const cantidadTexturas = {
        u: 4,
        v: 5
    }
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
    let L = C1 + C2 + C3 + C2 + C1
    L = L / cantidadTexturas.v; //longitud del cuerpo completo divido dos para 2 texturas en v
    const v = []
    //repito dos veces en las uniones, ahi tengo 2 vertices en la misma posicion
    /*
    v.push(0,
        C1 / L, C1 / L,
        (C1 + C2) / L, (C1 + C2) / L,
        (C1 + C2 + C3) / L, (C1 + C2 + C3) / L,
        (C1 + C2 + C3 + C2) / L, (C1 + C2 + C3 + C2) / L,
        (C1 + C2 + C3 + C2 + C1) / L) //->1

     */
    /*
    v.push(0,
        C1/2 / L, C1 / L,  C1 / L,
        (C1 + C2/2) / L,(C1 + C2) / L, (C1 + C2) / L,
        (C1 + C2 + C3/2) / L, (C1 + C2 + C3) / L,(C1 + C2 + C3) / L,
        (C1 + C2 + C3 + C2/2) / L, (C1 + C2 + C3 + C2) / L,(C1 + C2 + C3 + C2) / L,
        (C1 + C2 + C3 + C2 + C1/2) / L,(C1 + C2 + C3 + C2 + C1) / L);

     */


    v.push(0)
    const divisiones = utils.crearVectorEntre(1, 0, dimensionesTriangulosNucleo.filas + 1).slice(1)
    divisiones.push(1)
    const intervalos = [C1 / L, C2 / L, C3 / L, C2 / L, C1 / L];
    const suma = []
    suma.push(0)
    intervalos.reduce(function (valorAnterior, valorActual) {
        suma.push(valorAnterior)
        return valorAnterior + valorActual
    })
    intervalos.map(function (element, index) {
        v.push(...divisiones.map(punto => punto * element + suma[index]))
    });
    v.pop()

    const u = utils.crearVectorEntre(0, cantidadTexturas.u, dimensionesTriangulosNucleo.columnas + 1) //limite inferior 2 para 2 texturas en u

    const texTuboFix = []
    for (let i = 0; i <= dimensionesTriangulosNucleo.filas; i++) {
        texTuboFix.push(4 + (dimensionesTriangulosNucleo.filas - 1) * 2 + i)
    }

    const nuevasUV = []

    for (let i = 0; i < v.length; i++) {
        for (let j = 0; j < u.length; j++) {
            if (texTuboFix.includes(i)) { //arregla las texturas del cuerpo del tubo
                nuevasUV.push(1 - u[j], v[i])

            } else {
                nuevasUV.push(u[j], v[i])

            }
        }
    }


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


    const cilindroSup_NEW_indices = []
    cilindroSup.indices.forEach(indice => {
        cilindroSup_NEW_indices.push(indice + tapaSup_NEW_indices[tapaSup_NEW_indices.length - 1] + 1);

    });

    const tubo_NEW_indices = []
    tubo.indices.forEach(indice => {
        tubo_NEW_indices.push(indice + cilindroSup_NEW_indices[cilindroSup_NEW_indices.length - 1] + 1);
    });

    const cilindroInf_NEW_indices = []
    cilindroInf.indices.forEach(indice => {
        cilindroInf_NEW_indices.push(indice + tubo_NEW_indices[tubo_NEW_indices.length - 1] + 1);
    });

    const tapaInf_NEW_indices = []
    tapaInf.indices.forEach(indice => {
        tapaInf_NEW_indices.push(indice + cilindroInf_NEW_indices[cilindroInf_NEW_indices.length - 1] + 1);
    });
    // repito las uniones para que se dibujen lineas y no triangulos
    nucleoPS.indices.push(
        ...tapaSup_NEW_indices, tapaSup_NEW_indices[tapaSup_NEW_indices.length - 1], cilindroSup_NEW_indices[0],
        ...cilindroSup_NEW_indices, cilindroSup_NEW_indices[cilindroSup_NEW_indices.length - 1], tubo_NEW_indices[0],
        ...tubo_NEW_indices, tubo_NEW_indices[tubo_NEW_indices.length - 1], cilindroInf_NEW_indices[0],
        ...cilindroInf_NEW_indices, cilindroInf_NEW_indices[cilindroInf_NEW_indices.length - 1], tapaInf_NEW_indices[0],
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
        interior: {
            filas: 8,
            columnas: 12,
        },
        mastil: {
            filas: 80,
            columnas: 12,
        },

    };
    const dimensionesCilindroPastilla = {
        radioSuperior: 2.30,
        radioInferior: dimensiones.pastillas.cuerpo.radio,
        altura: 0.10,
    };
    const dimensionesTriangulosPastilla = {
        filas: 8, //segmentosRadiales
        columnas: 55, //segmentosDeAltura
    };
    //pastilla
    const pastilla = new Superficie(null, 'pastillaCuerpo')

    const cuerpo = new Tubo('pastillaCuerpo1', dimensiones.pastillas.cuerpo, dimensionesTriangulosPastilla)
    const cilindroSup = new Cilindro('pastillaCilindroSup1', dimensionesCilindroPastilla, dimensionesTriangulosPastilla)
    const tapaSup = new Tapa('pastillaTapaSup1', dimensionesCilindroPastilla.radioSuperior, dimensionesTriangulosPastilla)
    const cilindroInf = new Cilindro('pastillaCilindroInf1', dimensionesCilindroPastilla, dimensionesTriangulosPastilla)
    const tapaInf = new Tapa('pastillaTapaInf1', dimensionesCilindroPastilla.radioSuperior, dimensionesTriangulosPastilla)

    //CilindroSup
    const cilindroSupTyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroSupTyN, cilindroSupTyN, Math.PI / 2, [0, 1, 0]);

    const cilindroSupTransf = mat4.identity(mat4.create());
    mat4.translate(cilindroSupTransf, cilindroSupTransf, [0, dimensiones.pastillas.cuerpo.altura, 0]);
    mat4.multiply(cilindroSupTransf, cilindroSupTransf, cilindroSupTyN);

    const nuevasTanBitCilindroSup = utils.calcularTanYBiTan(cilindroSup)
    cilindroSup.tangentes = nuevasTanBitCilindroSup.tangentes

    const cilindroSup_NEW_AUX = utils.nuevasCoordenadas(cilindroSupTyN, cilindroSup, false)
    const cilindroSup_NEW = utils.nuevasCoordenadas(cilindroSupTransf, cilindroSup, false)
    cilindroSup_NEW.normales = cilindroSup_NEW_AUX.normales
    cilindroSup_NEW.tangentes = cilindroSup_NEW_AUX.tangentes

    //TapaSup
    const tapaSupTransf = mat4.identity(mat4.create());
    mat4.translate(tapaSupTransf, tapaSupTransf, [0, Anillo.alturaTapaSuperior, 0]);

    const nuevasTanBitTapaSup = utils.calcularTanYBiTan(tapaSup)
    tapaSup.tangentes = nuevasTanBitTapaSup.tangentes

    const tapaSup_NEW = utils.nuevasCoordenadas(tapaSupTransf, tapaSup, false)
    tapaSup_NEW.normales = tapaSup.normales
    tapaSup_NEW.tangentes = tapaSup.tangentes

    //CilindroInf
    const cilindroInfCTyN = mat4.identity(mat4.create());
    mat4.rotate(cilindroInfCTyN, cilindroInfCTyN, -Math.PI, [1, 0, 0]);
    mat4.rotate(cilindroInfCTyN, cilindroInfCTyN, Math.PI / 2, [0, 1, 0]);

    const nuevasTanBitCilindroInf = utils.calcularTanYBiTan(cilindroInf)
    cilindroInf.tangentes = nuevasTanBitCilindroInf.tangentes

    const cilindroInf_NEW = utils.nuevasCoordenadas(cilindroInfCTyN, cilindroInf, false)

    //TapaInf
    const tapaInfTyN = mat4.identity(mat4.create());
    mat4.rotate(tapaInfTyN, tapaInfTyN, -Math.PI, [1, 0, 0]);

    const tapaInfTransf = mat4.identity(mat4.create());
    mat4.translate(tapaInfTransf, tapaInfTransf, [0, -Anillo.alturaTapaInferior, 0]);
    mat4.multiply(tapaInfTransf, tapaInfTransf, tapaInfTyN);

    const nuevasTanBitTapaInf = utils.calcularTanYBiTan(tapaInf)
    tapaInf.tangentes = nuevasTanBitTapaInf.tangentes

    const tapaInf_NEW_AUX = utils.nuevasCoordenadas(tapaInfTyN, tapaInf, false)
    const tapaInf_NEW = utils.nuevasCoordenadas(tapaInfTransf, tapaInf, false)
    tapaInf_NEW.normales = tapaInf_NEW_AUX.normales
    tapaInf_NEW.tangentes = tapaInf_NEW_AUX.tangentes

    //nuevos indices
    const cilindroSup_NEW_indices = []
    cilindroSup.indices.forEach(indice => {
        cilindroSup_NEW_indices.push(indice + cuerpo.indices[cuerpo.indices.length - 1] + 1);
    });

    const tapaSup_NEW_indices = []
    tapaSup.indices.forEach(indice => {
        tapaSup_NEW_indices.push(indice + cilindroSup_NEW_indices[cilindroSup_NEW_indices.length - 1] + 1);
    });

    const cilindroInf_NEW_indices = []
    cilindroInf.indices.forEach(indice => {
        cilindroInf_NEW_indices.push(indice + tapaSup_NEW_indices[tapaSup_NEW_indices.length - 1] + 1);
    });

    const tapaInf_NEW_indices = []
    tapaInf.indices.forEach(indice => {
        tapaInf_NEW_indices.push(indice + cilindroInf_NEW_indices[cilindroInf_NEW_indices.length - 1] + 1);
    });


    pastilla.indices.push(
        ...cuerpo.indices, cuerpo.indices[cuerpo.indices.length - 1], cilindroSup_NEW_indices[0],
        ...cilindroSup_NEW_indices, cilindroSup_NEW_indices[cilindroSup_NEW_indices.length - 1], tapaSup_NEW_indices[0],
        ...tapaSup_NEW_indices, tapaSup_NEW_indices[tapaSup_NEW_indices.length - 1], cilindroInf_NEW_indices[0],
        ...cilindroInf_NEW_indices, cilindroInf_NEW_indices[cilindroInf_NEW_indices.length - 1], tapaInf_NEW_indices[0],
        ...tapaInf_NEW_indices,
    )
    //Vertices
    pastilla.vertices.push(
        ...cuerpo.vertices,
        ...cilindroSup_NEW.vertices,
        ...tapaSup_NEW.vertices,
        ...cilindroInf_NEW.vertices,
        ...tapaInf_NEW.vertices,
    );
    //normales
    pastilla.normales.push(
        ...cuerpo.normales,
        ...cilindroSup_NEW.normales,
        ...tapaSup_NEW.normales,
        ...cilindroInf_NEW.normales,
        ...tapaInf_NEW.normales,
    );
    //UV --> calularlas si se necesitan luego, por ahora solo las de defecto
    pastilla.textureCoords.push(
        ...cuerpo.textureCoords,
        ...cilindroSup.textureCoords,
        ...tapaSup.textureCoords,
        ...cilindroInf.textureCoords,
        ...tapaInf.textureCoords,
    );
    pastilla.tangentes.push(
        ...cuerpo.tangentes,
        ...cilindroSup_NEW.tangentes,
        ...tapaSup_NEW.tangentes,
        ...cilindroInf_NEW.tangentes,
        ...tapaInf_NEW.tangentes,
    )
    //Se carga a la escena
    pastilla.diffuse = colores.Pastilla
    scene.add(pastilla)

    //anillo y tubos interiores
    cargarTorus()
    scene.add(new Tubo('anillo_tuboH1', dimensiones.anillo.tubo, dimTriangulosTuboAnillo.mastil))
    scene.add(new Tubo('anillo_tuboH2', dimensiones.anillo.tubo, dimTriangulosTuboAnillo.mastil))

    scene.add(new Tubo('anillo_tuboV1', dimensiones.anillo.tubo, dimTriangulosTuboAnillo.mastil))
    scene.add(new Tubo('anillo_tuboV2', dimensiones.anillo.tubo, dimTriangulosTuboAnillo.mastil))

    const cantidadDeAnillosInteriores = 2 * Math.ceil(dimensiones.anillo.tubo.altura / (dimensiones.anillo.distanciaEntreTubos * 2))

    for (let i = 0; i < cantidadDeAnillosInteriores; i++) {
        scene.add(new Tubo('anillo_tuboInterior', dimensiones.anillo.tuboInterior, dimTriangulosTuboAnillo.interior))
    }

}

function cargarTorus() {

    const dimensionesTriangulosTorus = {
        filas: 30, //segmentosTubulares   //para el deploy 30
        columnas: 200, //segmentosRadiales  // par!!!
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
    const divisiones = 8
    const cant_UVTexture = dimensionesTriangulosTorus.columnas / divisiones - 1 //se copia la misma textura en el torus, se tiene (can_UVTexture +1 ) texturas
    //recordar -> para llenar el torus completo necesito 81 puntos, ya pusheo el cero, asi que el indiceU debe ser 80
    //dimenTrTorus.columnas = divisiones * (cant_UVTexture + 1)
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


            transformar.esferaEscenario();

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
            gl.uniform3fv(program.uLightDirection, lights.getArray('direction'));
            gl.uniform3fv(program.uLightPosition, lights.getArray('position'));
            gl.uniform4fv(program.uLightDiffuse, lights.getArray('diffuse'));



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
    gl.uniform1i(program.uLuzSpotLightEncendida, spotLightDir.luzSpotLightEncendida);


    if (object.alias === "greenLight" || object.alias === "redLight") {

        (object.alias === "greenLight") ?
        object.diffuse = lights.get('redLight').diffuse:null;
        (object.alias === "redLight") ?
        object.diffuse = lights.get('greenLight').diffuse:null;

        (spotLightDir.luzSpotLightEncendida)?
        gl.uniform1i(program.uLightSource, true):
        gl.uniform1i(program.uLightSource, false);

    }
    else
        gl.uniform1i(program.uLightSource, false);


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
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap.cubeTexture);

    } else if (object.texture) {

        gl.uniform1i(program.uHasTexture, true);

        const texture = textureLoader.textureMap[object.texture];

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture.diffuse.glTexture);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture.normal.glTexture);

        //si el objeto es la tierra cargamos nubes
        if (object.alias === 'tierra') {
            gl.uniform1i(program.uActivateEarthTextures, true);
            //nubes
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, texture.clouds.glTexture);
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
    cargarTexturasLuces();
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
















    */

            /*
                        'Bloques': {
                            value: bloque.type,
                            options: [Bloque.BLOQUES_4, Bloque.BLOQUES_5, Bloque.BLOQUES_6, Bloque.BLOQUES_7, Bloque.BLOQUES_8],
                            onChange: v => {
                                bloque.setType(v);
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
            ...lightsData.reduce((controls, light) => {
                const positionKeys = [
                    `X - ${light.name}`,
                    `Y - ${light.name}`,
                    `Z - ${light.name}`
                ];
                controls[light.name] = positionKeys.reduce((positionControls, position, i) => {
                    positionControls[position] = {
                        value: light.position[i],
                        min: -5, max: 5, step: 0.01,
                        onChange: (v, state) => {
                            lights.get(light.id).position = positionKeys.map(p => state[p]);
                        }
                    };
                    return positionControls;
                }, {});
                return controls;
            }, {}),
            ...['Light X', 'Light Y', 'Light Z'].reduce((result, name, i) => {
                result[name] = {
                    value: scaleLights[i],
                    min: 0, max: 1.0, step: 0.01,
                    onChange(v, state) {
                        scaleLights = [
                            state['Light X'],
                            state['Light Y'],
                            state['Light Z']
                        ];
                    }
                };
                return result;
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
                min: -0, max: 360, step: 1,
                onChange: v => {
                    spotLightDir.cambiarAzimuth(null, v)
                }
            },
            'elevation': {
                value: lightElevation,
                min: -0, max: 360, step: 1,
                onChange: v => {
                    spotLightDir.cambiarElevation(null, v)
                }
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
        }, {closed: true}
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