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
import {Cilindro, Plano, Superficie, Tapa, Torus, Tubo,} from "./js/Superficies";
import {Forma, SuperficieParametrica, SuperficieParametrica1} from "./js/SuperficiesDeBarrido";
import {Bloque} from "./js/Bloque";
import {CurvaCubicaDeBezier} from "./js/CurvasDeBezier";
import {DroneCameraControl} from "./js/droneCamara";
import {colores} from "./js/colores";
import {Anillo, Bloques, Capsula, Esfera, Nave, PanelesSolares, TransformacionesAfin} from "./js/TransformacionesAfin";
import {mat4, vec3} from "gl-matrix";
import {Texture} from "./js/Texture";


let
    gl, scene, program, camera, transforms, transformar, bloque, panelSolar, controles, droneCam,
    targetNave, targetPanelesSolares, //focus de la nave y los paneles en el cual se enfoca la camara
    elapsedTime, initialTime, texture, texture1, texture2, cubeTexture,
    fixedLight = true,
    triangleStrip = true,
    wireframe = false,
    ajuste = 8.0,  //para ajustar posiciones de los objetos, se usa en el diseño
    dxAnillo = 0.01,
    lightPosition = [20, 20, 20],
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
        'uModelViewMatrix',
        'uNormalMatrix',
        'uMaterialDiffuse',
        'uMaterialAmbient',
        'uMaterialSpecular',
        'uLightAmbient',
        'uLightDiffuse',
        'uLightSpecular',
        'uLightPosition',
        'uShininess',
        'uUpdateLight',
        'uWireframe',
        'uAjuste',
        'uHasTexture',
        'uIsTheCubeMapShader',
        'uSampler',
        /*'uSpecularSampler',*/
        'uNormalSampler',
        'uCubeSampler'
    ];

    // Load attributes and uniforms
    program.load(attributes, uniforms);

    // Configure `scene`
    scene = new Scene(gl, program);

    // Configure `camera` and `controls`
    camera = new Camera(Camera.ORBITING_TYPE, 70, 0);
    camera.goTo([0, 0, 50], 0, -60, [0, 0, 0])
    droneCam = new DroneCameraControl([0, 0, -10], camera);
    controles = new Controls(camera, canvas, droneCam);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);

    gl.uniform3fv(program.uLightPosition, lightPosition);
    gl.uniform4fv(program.uLightAmbient, [0.2, 0.2, 0.2, 1]);
    gl.uniform4fv(program.uLightDiffuse, [1, 1, 1, 1]);
    gl.uniform4fv(program.uLightSpecular, [1, 1, 1, 1]);
    gl.uniform1f(program.uShininess, 230);

    //Bloques del anillo
    bloque = new Bloque(dimensiones.anillo.radio, scene)

    const intervaloEnGrados = 30; //cada 15,30, 45, 60, 75, 90 grados del giro del anillo
    //Transformaciones afines
    transformar = new TransformacionesAfin(transforms, droneCam, controles, camera, bloque,
        new AnimacionPanelesSolares(300, intervaloEnGrados)
    );

    // CubeMap
    // Configure cube texture
    const skyBoxFiles = [
        "Left_1K_TEX.png",
        "Right_1K_TEX.png",
        "Up_1K_TEX.png",
        "Down_1K_TEX.png",
        "Front_1K_TEX.png",
        "Back_1K_TEX.png"
    ];
    const skyBox_url = [[], [], []];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 6; j++) {
            skyBox_url[i].push(`/skyBox/` + (i + 1).toString() + `/${skyBoxFiles[j]}`)
        }
    }

    cubeTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    //cada vez que empieza el programa, elige aleatoriamente un set de texturas para el cubemap
    let random = Math.floor(Math.random() * 3);

    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, skyBox_url[random][0]);
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, skyBox_url[random][1]);
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, skyBox_url[random][2]);
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, skyBox_url[random][3]);
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, skyBox_url[random][4]);
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, skyBox_url[random][5]);

    //textures

    texture = new Texture(gl, 'UV.jpg');
    // texture1 = new Texture(gl, 'earthSpecular.jpg');
    texture2 = new Texture(gl, 'UV_normal.jpg');

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

    scene.load('/geometries/cube-texture.json', 'cubeMap');
    scene.load('/sphere.json', 'light');


    // scene.add(new Floor(80, 1));
    // scene.add(new Axis(82));


    const nave = new Superficie(null, 'nave')
    scene.add(nave)


    cargarNucleo()


    panelSolar = new PanelSolar(scene);
    panelSolar.cargarPanelesSolares()
    panelSolar.cargarPanelesSolares1()
    cargarAnillo()
    bloque.setType(Bloque.BLOQUES_4);
    moduloVioleta()
    cargarEsfera()
    cargarCapsula()


    // test()

    // cargarPlanetaTierra()

    //cubo()


    // scene.load('/geometries/cube-complex.json', 'complexCube', { hidden: true });

    //teatro()
    //superTest()
}


function nuevasCoordenadas(matrizDeTransformacion, superficie, unshift = false) {

    const vertices = superficie.vertices
    const normales = superficie.normales
    const tangentes = superficie.tangentes
    const newVertices = []
    const newNormales = []
    const newTangentes = []
    let i = 0, f = 3;

    (vertices.length !== normales.length) ? console.log('Vertices y normales distinta longitud') : null;
    while (f <= vertices.length) {

        const new_vertex = vec3.fromValues(...vertices.slice(i, f));
        const new_normal = vec3.fromValues(...normales.slice(i, f));
        const new_tangente = vec3.fromValues(...tangentes.slice(i, f));

        vec3.transformMat4(new_normal, new_normal, matrizDeTransformacion);
        vec3.transformMat4(new_vertex, new_vertex, matrizDeTransformacion);
        vec3.transformMat4(new_tangente, new_tangente, matrizDeTransformacion);

        (unshift) ? newVertices.unshift(...new_vertex) : newVertices.push(...new_vertex);

        vec3.normalize(new_normal, new_normal);
        (unshift) ? newNormales.unshift(...new_normal) : newNormales.push(...new_normal);

        vec3.normalize(new_tangente, new_tangente);
        (unshift) ? newTangentes.unshift(...new_tangente) : newTangentes.push(...new_tangente);

        i += 3
        f += 3
    }
    (newVertices.length !== newNormales.length) ? console.log('Vertices y normales nuevas distinta longitud') : null;
    (vertices.length !== newVertices.length) ? console.log('Vertices transformados no coinciden en longitud') : null;
    (normales.length !== newNormales.length) ? console.log('Normales transformadas no coinciden en longitud') : null;
    return {
        vertices: newVertices,
        normales: newNormales,
        tangentes: newTangentes

    }
}

function superTest() {
    //Se necesita 6 planos para cubo
    const dimensionesTringulos = {
        filas: 1,
        columnas: 1,
    }
    const dimensiones = {
        ancho: 5,
        largo: 5,
    }
    scene.add(new Superficie(null, 'superTest'))

    const cubo_lado1 = new Plano('superTest1', dimensiones, dimensionesTringulos)
    const cubo_lado2 = new Plano('superTest2', dimensiones, dimensionesTringulos)
    const cubo_lado3 = new Plano('superTest3', dimensiones, dimensionesTringulos)
    const cubo_lado4 = new Plano('superTest4', dimensiones, dimensionesTringulos)
    const cubo_lado5 = new Plano('superTest5', dimensiones, dimensionesTringulos)
    const cubo_lado6 = new Plano('superTest6', dimensiones, dimensionesTringulos)


    //Matrices de transformacion
    const cuboLado1Transform = mat4.identity(mat4.create());
    //mat4.rotate(cuboLadoTransform, cuboLadoTransform , Math.PI / 2, [1, 0, 0]);
    mat4.translate(cuboLado1Transform, cuboLado1Transform, [0, 0, 2.5]);
    mat4.rotate(cuboLado1Transform, cuboLado1Transform, Math.PI / 2, [1, 0, 0]);

    const cuboLado2Transform = mat4.identity(mat4.create());
    mat4.rotate(cuboLado2Transform, cuboLado2Transform, Math.PI / 2, [1, 0, 0]);
    mat4.multiply(cuboLado2Transform, cuboLado2Transform, cuboLado1Transform);

    const cuboLado3Transform = mat4.identity(mat4.create());
    mat4.rotate(cuboLado3Transform, cuboLado3Transform, Math.PI, [1, 0, 0]);
    mat4.multiply(cuboLado3Transform, cuboLado3Transform, cuboLado1Transform);

    const cuboLado4Transform = mat4.identity(mat4.create());
    mat4.rotate(cuboLado4Transform, cuboLado4Transform, -Math.PI / 2, [1, 0, 0]);
    mat4.multiply(cuboLado4Transform, cuboLado4Transform, cuboLado1Transform);

    const cuboLado5Transform = mat4.identity(mat4.create());
    mat4.rotate(cuboLado5Transform, cuboLado5Transform, Math.PI / 2, [0, 1, 0]);
    mat4.multiply(cuboLado5Transform, cuboLado5Transform, cuboLado1Transform);

    const cuboLado6Transform = mat4.identity(mat4.create());
    mat4.rotate(cuboLado6Transform, cuboLado6Transform, -Math.PI / 2, [0, 1, 0]);
    mat4.multiply(cuboLado6Transform, cuboLado6Transform, cuboLado1Transform);

    const {
        vertices: newVertices2,
        normales: newNormales2
    } = nuevasCoordenadas(cuboLado2Transform, cubo_lado2.vertices, cubo_lado2.normales)

    const {
        vertices: newVertices1,
        normales: newNormales1
    } = nuevasCoordenadas(cuboLado1Transform, cubo_lado1.vertices, cubo_lado1.normales)

    const {
        vertices: newVertices3,
        normales: newNormales3
    } = nuevasCoordenadas(cuboLado3Transform, cubo_lado3.vertices, cubo_lado3.normales)

    const {
        vertices: newVertices4,
        normales: newNormales4
    } = nuevasCoordenadas(cuboLado4Transform, cubo_lado4.vertices, cubo_lado4.normales)

    const {
        vertices: newVertices5,
        normales: newNormales5
    } = nuevasCoordenadas(cuboLado5Transform, cubo_lado5.vertices, cubo_lado5.normales)

    const {
        vertices: newVertices6,
        normales: newNormales6
    } = nuevasCoordenadas(cuboLado6Transform, cubo_lado6.vertices, cubo_lado6.normales)
    console.log(newVertices6, newNormales6)
    const newV = []
    newV.push(...newVertices1, ...newVertices2, ...newVertices3, ...newVertices4, ...newVertices5, ...newVertices6)
    const newN = []
    newN.push(...newNormales1, ...newNormales2, ...newNormales3, ...newNormales4, ...newNormales5, ...newNormales6)

    cubo_lado1.vertices = newV
    cubo_lado1.normales = newN
    console.log(cubo_lado1)
    const arr = [0,
        2,
        1,
        3,
        3,
        2,
        2,
        4,
        3,
        5,
        5,
        4,
        4,
        6,
        5,
        7,
        7,
        6,
        6,
        8,
        7,
        9,
        9,
        8,
        8,
        10,
        9,
        11,
        11,
        10,
        10,
        12,
        11,
        13,
        13,
        12,
        12,
        14,
        13,
        15,
        15,
        14,
        14,
        16,
        15,
        17,
        17,
        16,
        16,
        18,
        17,
        19,
        19,
        18,
        18,
        20,
        19,
        21,
        21,
        20,
        20,
        22,
        21,
        23
    ]
    const arr2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 22, 22, 20, 23, 21]
    cubo_lado1.indices = arr2 //[0,2,1,3,3,4,5,6,7,8,9,10,11]


    scene.add(cubo_lado1)


}

function teatro() {
    const dimensionesTringulos = {
        filas: 10,
        columnas: 10,
    }
    const dimensiones = {
        ancho: 5,
        largo: 5,
    }
    let i = 0;
    scene.add(new Superficie(null, 'teatro'))

    while (3 > i++) {
        const cubo_lado = new Plano('teatro_lado', dimensiones, dimensionesTringulos)
        cubo_lado.alias = 'teatro_lado' + i.toString()
        //cubo_lado.diffuse = [0.2,0.2,0.2,1.0]
        cubo_lado.ambient = [0.2, 0.2, 0.2, 1.0]
        console.log(cubo_lado)
        scene.add(cubo_lado)
        console.log(cubo_lado)

    }

}

function cubo() {
    //Se necesita 6 planos para cubo
    const dimensionesTringulos = {
        filas: 1,
        columnas: 1,
    }
    const dimensiones = {
        ancho: 5,
        largo: 5,
    }
    let i = 0;
    scene.add(new Superficie(null, 'cubo'))

    while (6 > i++) {
        const cubo_lado = new Plano('cubo_lado', dimensiones, dimensionesTringulos)
        cubo_lado.alias = 'cubo_lado' + i.toString()
        //cubo_lado.diffuse = [0.0,0.0,0.0,1.0]
        cubo_lado.ambient = [0.2, 0.2, 0.2, 1.0]
        console.log(cubo_lado)
        scene.add(cubo_lado)

    }
}

function test() {
    const dimensionesTringulos = {
        filas: 10,
        columnas: 10,
    }
    const dimensiones = {
        ancho: 1,
        largo: 2,
    }
    const dimensionesOrigen = {
        ancho: 0.2,
        largo: 0.2,
    }


    const testSup = new Plano('test', dimensiones, dimensionesTringulos)
    testSup.hasTexture = true;
    scene.add(testSup);
    scene.add(new Plano('testOrigen', dimensionesOrigen, dimensionesTringulos))
}

function cargarPlanetaTierra() {

    const pasoDiscretoRecorrido = 50
    const divisionesForma = 50 //precision en la forma

    const porcionDeCircunferencia = 1 / 2
    const radio = 10
    //reutilizo la funcion para crear una forma circular
    const forma = utils.crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)

    //rotar los puntos del recorrido x,y 45 grados
    const angulo = 0    //Math.PI/4 //tengo que rotar, los puntos obtenidos parten de cero
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
        tangentes: forma.puntos.map(punto => {
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

    //Klave para la sup de Rev
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    const nuevaSup = new SuperficieParametrica1("luna", datosDeLaForma, datosDelRecorrido, dimensiones, true)
    //nuevaSup.hasTexture = true;
    //nuevaSup.diffuse = [1.0, 1.0, 1.0, 1];
    scene.add(nuevaSup)

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
        })
    }

    const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

    //Klave para la sup de Rev
    const datosDelRecorrido = utils.crearRecorridoCircular(0, 1, dimensiones["filas"])

    const nuevaSup = new SuperficieParametrica("esfera", datosDeLaForma, datosDelRecorrido, dimensiones, true)
    scene.add(nuevaSup)

    scene.add(new Tapa('esferaTapaAtras', radio * Math.sin(angulo), {
        filas: 1, //segmentosRadiales
        columnas: pasoDiscretoRecorrido, //segmentosDeAltura
    }), {
        diffuse: colorGenerico,
    });

    scene.add(new Tapa('esferaTapaAdelante', radio * Math.sin(angulo), {
        filas: 1, //segmentosRadiales
        columnas: pasoDiscretoRecorrido, //segmentosDeAltura
    }), {
        diffuse: colorGenerico,
    });
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

    scene.add(new SuperficieParametrica("moduloVioletaPS", datosDeLaForma, datosDelRecorrido, dim), {
        diffuse: colores.Violeta,
    });
    scene.add(new SuperficieParametrica("moduloVioletaAnillo", datosDeLaForma, datosDelRecorrido, dim), {
        diffuse: colores.Violeta,
    });

}


function calcularTangentes1(superficie) {
    // Calculate tangets for a given set of vertices
    const vs = superficie.vertices
    const tc = superficie.textureCoords
    const ind = superficie.indices
    //vs tc ind
    const tangents = [];
    // console.log(superficie.tangentes)
    for (let i = 0; i < vs.length / 3; i++) {
        tangents[i] = [0, 0, 0];
    }

    let
        a = [0, 0, 0],
        b = [0, 0, 0],
        deltaUV1 = [0, 0],
        deltaUV2 = [0, 0],
        f = 1.0,
        triTangent = [0, 0, 0];

    for (let i = 0; i < ind.length; i++) {
        const i0 = ind[i];
        const i1 = ind[i + 1];
        const i2 = ind[i + 2];

        const pos0 = [vs[i0 * 3], vs[i0 * 3 + 1], vs[i0 * 3 + 2]];
        const pos1 = [vs[i1 * 3], vs[i1 * 3 + 1], vs[i1 * 3 + 2]];
        const pos2 = [vs[i2 * 3], vs[i2 * 3 + 1], vs[i2 * 3 + 2]];

        const tex0 = [tc[i0 * 2], tc[i0 * 2 + 1]];
        const tex1 = [tc[i1 * 2], tc[i1 * 2 + 1]];
        const tex2 = [tc[i2 * 2], tc[i2 * 2 + 1]];

        vec3.subtract(a, pos1, pos0);
        vec3.subtract(b, pos2, pos0);

        const c2c1b = tex1[1] - tex0[1];
        const c3c1b = tex2[0] - tex0[1];

        deltaUV1[0] = tex1[0] - tex0[0];
        deltaUV1[1] = tex1[1] - tex0[1];

        deltaUV2[0] = tex2[0] - tex0[0];
        deltaUV2[1] = tex2[1] - tex0[1];

        f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);
        triTangent = [
            f * (deltaUV2[1] * a[0] - deltaUV1[1] * b[0]),
            f * (deltaUV2[1] * a[1] - deltaUV1[1] * b[1]),
            f * (deltaUV2[1] * a[2] - deltaUV1[1] * b[2])
        ];

        // triTangent = [c3c1b * a[0] - c2c1b * b[0], c3c1b * a[1] - c2c1b * b[1], c3c1b * a[2] - c2c1b * b[2]];
        // console.log(triTangent)

        //recorrer triTanget si todos son cero return pass
        if (triTangent[0] === 0 && triTangent[1] === 0 && triTangent[2] === 0)
            continue;
        if (isNaN(triTangent[0]) || isNaN(triTangent[1]) || isNaN(triTangent[2]))
            continue;


        vec3.add(tangents[i0], tangents[i0], triTangent);
        vec3.add(tangents[i1], tangents[i1], triTangent);
        vec3.add(tangents[i2], tangents[i2], triTangent);
    }

    // Normalize tangents
    const ts = [];

    tangents.forEach(tan => {
        vec3.normalize(tan, tan);
        ts.push(tan[0]);
        ts.push(tan[1]);
        ts.push(tan[2]);
    });
    // console.log(ts)

    return ts;

}


function calcularTangentes(superficie) {
    // Calculate tangets for a given set of vertices
    const vs = superficie.vertices
    const tc = superficie.textureCoords
    const ind = superficie.indices
    //vs tc ind
    const tangents = [];
    // console.log(superficie.tangentes)
    for (let i = 0; i < vs.length / 3; i++) {
        tangents[i] = [0, 0, 0];
    }

    let
        a = [0, 0, 0],
        b = [0, 0, 0],
        triTangent = [0, 0, 0];

    for (let i = 0; i < ind.length - 2; i++) {
        const i0 = ind[i];
        const i1 = ind[i + 1];
        const i2 = ind[i + 2];

        if (i0 === i1 || i0 === i2 || i1 === i2) {
            continue
        }

        const pos0 = [vs[i0 * 3], vs[i0 * 3 + 1], vs[i0 * 3 + 2]];
        const pos1 = [vs[i1 * 3], vs[i1 * 3 + 1], vs[i1 * 3 + 2]];
        const pos2 = [vs[i2 * 3], vs[i2 * 3 + 1], vs[i2 * 3 + 2]];

        const tex0 = [tc[i0 * 2], tc[i0 * 2 + 1]];
        const tex1 = [tc[i1 * 2], tc[i1 * 2 + 1]];
        const tex2 = [tc[i2 * 2], tc[i2 * 2 + 1]];

        vec3.subtract(a, pos1, pos0);
        vec3.subtract(b, pos2, pos0);

        const c2c1b = tex1[1] - tex0[1];
        const c3c1b = tex2[0] - tex0[1];

        triTangent = [c3c1b * a[0] - c2c1b * b[0], c3c1b * a[1] - c2c1b * b[1], c3c1b * a[2] - c2c1b * b[2]];
        // console.log(triTangent)

        vec3.add(tangents[i0], tangents[i0], triTangent);
        vec3.add(tangents[i1], tangents[i1], triTangent);
        vec3.add(tangents[i2], tangents[i2], triTangent);
    }

    // Normalize tangents
    const ts = [];

    tangents.forEach(tan => {
        vec3.normalize(tan, tan);
        ts.push(tan[0]);
        ts.push(tan[1]);
        ts.push(tan[2]);
    });
    // console.log(ts)

    return ts;

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

    const tubo_NEW = nuevasCoordenadas(tuboTransformacion, tubo, true)

    const cilindroSup_NEW = nuevasCoordenadas(cilidroSupTransformacion, cilindroSup, true)
    const cilindroSup_NEW_normals_tangents = nuevasCoordenadas(cilindroSupOnlyNormalsTangentsTransform, cilindroSup, true)
    cilindroSup_NEW.normales = cilindroSup_NEW_normals_tangents.normales
    cilindroSup_NEW.tangentes = cilindroSup_NEW_normals_tangents.tangentes

    const tapaSup_NEW = nuevasCoordenadas(tapaSupTransformacion, tapaSup)
    const cilindroInf_NEW = nuevasCoordenadas(cilidroInfTransformacion, cilindroInf)

    const tapaInf_NEW = nuevasCoordenadas(tapaInfTransformacion, tapaInf, true)
    const tapaInf_NEW_normals_tangents = nuevasCoordenadas(tapaInfOnlyNormalsTangentsTransform, tapaInf, true)
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

    const nuevasTan = calcularTangentes(nucleoPS);
    // nucleoPS.tangentes = nuevasTan

    // console.log(nucleoPS.tangentes, nuevasTan)

    // printArray2D(nuevasUV)
    // printArray2D(cilindroSup.textureCoords)
    nucleoPS.diffuse = [0.9, 0.9, 0.9, 1.0];

    nucleoPS.hasTexture = true;
    //clone object nucleoPS
    const nucleoAnillo = Object.assign({}, nucleoPS);
    nucleoAnillo.alias = "nucleoAnillo";

    scene.add(nucleoPS)
    scene.add(nucleoAnillo)
}

function printArray2D(array) {
    //imprimir en pares
    for (let i = 0; i < array.length; i = i + 2) {
        //print with fixed 2 decimals
        console.log(array[i].toFixed(2) + " " + array[i + 1].toFixed(2));
    }
}

function cargarAnillo() {
    const arc = Math.PI * 2;
    const dimensionesTriangulosTorus = {
        filas: 20, //segmentosTubulares   //para el deploy 30
        columnas: 80, //segmentosRadiales  //para el deploy 80
    };
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

    scene.add(new Torus("torus", dimensiones.anillo.radio, dimensiones.anillo.radioInterior, dimensionesTriangulosTorus, arc))
    scene.add(new Tubo('anillo_tuboH1', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))
    scene.add(new Tubo('anillo_tuboH2', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))

    scene.add(new Tubo('anillo_tuboV1', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))
    scene.add(new Tubo('anillo_tuboV2', dimensiones.anillo.tubo, dimTriangulosTuboAnillo))

    const cantidadDeAnillosInteriores = 2 * Math.ceil(dimensiones.anillo.tubo.altura / (dimensiones.anillo.distanciaEntreTubos * 2))

    for (let i = 0; i < cantidadDeAnillosInteriores; i++) {
        scene.add(new Tubo('anillo_tuboInterior', dimensiones.anillo.tuboInterior, dimTriangulosTuboAnillo))
    }


}

function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    transforms.updatePerspective();

    try {
        gl.uniform1i(program.uUpdateLight, fixedLight);

        // Iterate over every object in the scene
        scene.traverse(object => {
            if (object.hidden) return;
            // Calculate local transformations
            transforms.calculateModelView();
            const matrix = transforms.push();

            //cubmaps
            if (object.alias === "cubeMap") {
                const cubeMapTransform = transforms.modelViewMatrix;
                const factor = 2048;

                const {
                    rotationMatrix,
                    position,
                } = droneCam.update()

                mat4.translate(cubeMapTransform, Capsula.capsulaTransform, position);
                mat4.multiply(cubeMapTransform, cubeMapTransform, rotationMatrix);
                // mat4.multiply(cubeMapTransform, cubeMapTransform, camera.getViewTransform());
                mat4.scale(cubeMapTransform, cubeMapTransform, [factor, factor, factor]);
                // return;
            }

            //luz
            // If object is the light, we update its position
            if (object.alias === 'light') {
                const lightTransform = transforms.modelViewMatrix
                const lightPosition = program.getUniform(program.uLightPosition)
                mat4.translate(lightTransform, lightTransform, lightPosition);
                mat4.scale(lightTransform, lightTransform, [0.5, 0.5, 0.5]);
            }


            //Actualizo el wireframe
            if (object.alias !== 'floor' && object.alias !== 'axis') {
                object.wireframe = wireframe;
            }
            // Ubico las partes de la nave en la escena
            transformar.setAlias(object.alias)

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
            transformar.complexCube()

            transformar.teatro()
            transformar.cubo()
            transformar.luna()

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
    //Cubemap
    if (object.alias === 'cubeMap') {
        //le indicamos al shader las acciones que tiene que tomar con la cubemap
        gl.uniform1i(program.uHasTexture, false);
        gl.uniform1i(program.uIsTheCubeMapShader, true);

        // Activate cube map
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.uniform1i(program.uCubeSampler, 0);

    } else
        // Activate texture
    if (object.hasTexture) {

        gl.uniform1i(program.uIsTheCubeMapShader, false);
        gl.uniform1i(program.uHasTexture, true);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
        gl.uniform1i(program.uSampler, 1)
        /*
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, texture1.glTexture);
                gl.uniform1i(program.uSpecularSampler, 1);
        */
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture2.glTexture);
        gl.uniform1i(program.uNormalSampler, 2);
    } else {

        gl.uniform1i(program.uIsTheCubeMapShader, false);
        gl.uniform1i(program.uHasTexture, false);
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


            ...['Translate X', 'Translate Y', 'Translate Z'].reduce((result, name, i) => {
                result[name] = {
                    value: lightPosition[i],
                    min: -20, max: 20, step: 0.1,
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

            //'Go Home': () => camera.goHome(),


            'Bloques': {
                value: bloque.type,
                options: [Bloque.BLOQUES_4, Bloque.BLOQUES_5, Bloque.BLOQUES_6, Bloque.BLOQUES_7, Bloque.BLOQUES_8],
                onChange: v => {
                    bloque.setType(v);
                }
            },
            'Static Light Position': {
                value: fixedLight,
                onChange: v => fixedLight = v
            },
            'Ajuste': {
                value: ajuste,
                min: -2.0, max: 2.0, step: 0.1,
                onChange: v => gl.uniform1f(program.uAjuste, v)
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