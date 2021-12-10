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
import {Floor} from "./js/Floor";
import {Axis} from "./js/Axis";


let
    gl, scene, program, camera, transforms, transformar, bloque, panelSolar, controles, droneCam,
    targetNave, targetPanelesSolares, //focus de la nave y los paneles en el cual se enfoca la camara
    elapsedTime, initialTime, texture, texture1, texture2, cubeTexture,
    fixedLight = true,
    triangleStrip = true,
    wireframe = false,
    ajuste = 8.0,  //para ajustar posiciones de los objetos, se usa en el diseño
    dxAnillo = 0.01,
    lightPosition = [0, 50, 200],
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
        'uSpecularSampler',
        'uNormalSampler',
        'uCubeSampler'
    ];

    // Load attributes and uniforms
    program.load(attributes, uniforms);

    // Configure `scene`
    scene = new Scene(gl, program);

    // Configure `camera` and `controls`
    camera = new Camera(Camera.ORBITING_TYPE, 70, 0);
    camera.goTo([0, 0, 40], -0, -30, [0, 0, 0])
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


    /*
     * Texturas
     */
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

    // Textures
    texture = new Texture(gl, 'UV.jpg');
    // texture1 = new Texture(gl, 'earthSpecular.jpg');
    texture2 = new Texture(gl, 'UV_normal.jpg');

    //Asignando unidades de texturas
    const cubeMapTextureUnit = 0;
    const samplerTextureUnit = 1;
    const normalTextureUnit = 2;

    gl.uniform1i(program.uCubeSampler, cubeMapTextureUnit);
    gl.uniform1i(program.uSampler, samplerTextureUnit);
    gl.uniform1i(program.uNormalSampler, normalTextureUnit);

    // console.log("cubeSampler",program.getUniform(program.uCubeSampler))
    // console.log("sampler",program.getUniform(program.uSampler))
    // console.log("normal",program.getUniform(program.uNormalSampler))


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
    scene.add(new Superficie(null, 'nave'))
    cargarNucleo()
    panelSolar = new PanelSolar(scene);
    panelSolar.cargarPanelesSolares()
    cargarAnillo()
    bloque.setType(Bloque.BLOQUES_4);
    moduloVioleta()
    cargarEsfera()
    cargarCapsula()
    // cargarPlanetaTierra()
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
    const nuevasTanBitTapaAdelante = calcularTanYBiTan(tapaAdelante)
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
    const nuevasTanBitTapaAtras = calcularTanYBiTan(tapaAtras)
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
    VTextureCoordAtras.push(0.8,1.0)
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
    for(let i=0; i<=pasoDiscretoForma; i++) {
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
        ...tapaAdelante.indices,61,62,
        ...cuerpo_NEW_indices, 712,713,
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
    const nuevasTanBitCuerpo = calcularTanYBiTan(cuerpo)
    esfera.tangentes.push(
        ...TapaAdelante_NEW.tangentes,
        ...nuevasTanBitCuerpo.tangentes,
        ...TapaAtras_NEW.tangentes
    )
    //UV
    esfera.textureCoords.push(
        ...newTextureCoords,
        ...newTextureCoordsCuerpo,
        ...newTextureCoordsAtras
    );
    //Se carga a la escena
    esfera.diffuse = colores.Textura
    esfera.hasTexture = true
    scene.add(esfera)
}

function calcularTanYBiTan(superficie){
    const {vertices, indices, textureCoords} = superficie

    const verticesArray = utils.arrayDeVectores(vertices, 3)
    const textureCoordsArray = utils.arrayDeVectores(textureCoords, 2)


    const tangentes = []
    const bitangentes = []

    for (let i = 0; i < verticesArray.length; i++) {
        tangentes[i] = [0, 0, 0];
        bitangentes[i] = [0, 0, 0];
    }

    const tan={
        x:0,
        y:0,
        z:0
    }
    const bitan={
        x:0,
        y:0,
        z:0
    }
    let f_value = 0; //se usa en el caso de que f sea infinito
    let seAsignof = false;
    for (let i = 0; i < indices.length-2; i++) {
        const indice1 = indices[i]
        const indice2 = indices[i + 1]
        const indice3 = indices[i + 2]

        const v1 = verticesArray[indice1]
        const v2 = verticesArray[indice2]
        const v3 = verticesArray[indice3]


        const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]]
        const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]]

        const t1 = textureCoordsArray[indice1]
        const t2 = textureCoordsArray[indice2]
        const t3 = textureCoordsArray[indice3]

        const deltaU1 = t2[0] - t1[0]
        const deltaV1 = t2[1] - t1[1]

        const deltaU2 = t3[0] - t1[0]
        const deltaV2 = t3[1] - t1[1]

        let f = 1/((deltaU1 * deltaV2) - (deltaU2 * deltaV1));
        if(!seAsignof && f!==Infinity && f!==-Infinity && f!==0){
            f_value = Math.abs(f);
            seAsignof = true;
        }
        (f === Infinity) ? f = f_value : null;
        (f === -Infinity) ? f = -f_value : null;


        tan.x = f * ((deltaV2 * edge1[0]) - (deltaV1 * edge2[0]))
        tan.y = f * ((deltaV2 * edge1[1]) - (deltaV1 * edge2[1]))
        tan.z = f * ((deltaV2 * edge1[2]) - (deltaV1 * edge2[2]))

        bitan.x = f * ((deltaU1 * edge2[0]) - (deltaU2 * edge1[0]))
        bitan.y = f * ((deltaU1 * edge2[1]) - (deltaU2 * edge1[1]))
        bitan.z = f * ((deltaU1 * edge2[2]) - (deltaU2 * edge1[2]))

        const tanAnterior1 = tangentes[indice1]
        const tanAnterior2 = tangentes[indice2]
        const tanAnterior3 = tangentes[indice3]

        const bitanAnterior1 = bitangentes[indice1]
        const bitanAnterior2 = bitangentes[indice2]
        const bitanAnterior3 = bitangentes[indice3]

        tangentes[indice1] = [tanAnterior1[0] + tan.x, tanAnterior1[1] + tan.y, tanAnterior1[2] + tan.z]
        tangentes[indice2] = [tanAnterior2[0] + tan.x, tanAnterior2[1] + tan.y, tanAnterior2[2] + tan.z]
        tangentes[indice3] = [tanAnterior3[0] + tan.x, tanAnterior3[1] + tan.y, tanAnterior3[2] + tan.z]

        bitangentes[indice1] = [bitanAnterior1[0] + bitan.x, bitanAnterior1[1] + bitan.y, bitanAnterior1[2] + bitan.z]
        bitangentes[indice2] = [bitanAnterior2[0] + bitan.x, bitanAnterior2[1] + bitan.y, bitanAnterior2[2] + bitan.z]
        bitangentes[indice3] = [bitanAnterior3[0] + bitan.x, bitanAnterior3[1] + bitan.y, bitanAnterior3[2] + bitan.z]
    }

    //recorro y normalizo
    const TAN=[]
    tangentes.forEach((t,i)=>{
        TAN.push(...utils.normalizarVector(t))
    })

    const BITAN = []
    bitangentes.forEach((t,i)=>{
        BITAN.push( utils.normalizarVector(t))
    })

    return{
        tangentes:TAN,
        bitangentes:BITAN
    }
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
    const moduloVioletaAnillo = new SuperficieParametrica1("moduloVioletaAnillo", datosDeLaForma, datosDelRecorrido, dim)

    moduloVioletaPS.textureCoords = nuevasUV
    moduloVioletaAnillo.textureCoords = nuevasUV

    scene.add(moduloVioletaPS, {
        diffuse: colores.Textura,
        hasTexture: true,
    });

    scene.add(moduloVioletaAnillo, {
        diffuse: colores.Textura,
        hasTexture: true,
    });

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
        // gl.uniform1i(program.uCubeSampler, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);

    } else
        // Activate texture
    if (object.hasTexture) {

        gl.uniform1i(program.uIsTheCubeMapShader, false);
        gl.uniform1i(program.uHasTexture, true);

        // gl.uniform1i(program.uSampler, 1)
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
        /*
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, texture1.glTexture);
                gl.uniform1i(program.uSpecularSampler, 1);
        */
        // gl.uniform1i(program.uNormalSampler, 2);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture2.glTexture);
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


      'Bloques': {
                value: bloque.type,
                options: [Bloque.BLOQUES_4, Bloque.BLOQUES_5, Bloque.BLOQUES_6, Bloque.BLOQUES_7, Bloque.BLOQUES_8],
                onChange: v => {
                    bloque.setType(v);
                }
            },








    */






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