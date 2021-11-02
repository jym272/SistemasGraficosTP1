import './style.css'

import * as THREE from "three";
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { toTrianglesDrawMode } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const cursor = {
    x: 0,
    y: 0,
}
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const parameters = {
    color: '#ff0000',
    sprint: () => {
        gsap.to(
            mesh.rotation,
            {z:4*Math.PI + mesh.rotation.z, duration:1}
        )

    },
}


/**
 * Scene, Canvas, Render, Geometria, Camera, Controls
 */
const canvas = document.querySelector('.WebGL')
const escena = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({
    canvas: canvas //propiedad igual al nombre
})
renderer.setSize(sizes.width, sizes.height)
const camara = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camara.position.set(0.5,1,1.5) //clave si no veo nada
//UV
//console.log(geometria.geometry.attributes.uv)
//rotacion sobre el eje y
//gsap.to(geometria.rotation, {y:2*Math.PI, duration:8, ease:"linear", repeat:-1} )

//ORBIT CONTROLS

const controls = new OrbitControls(camara, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.04
///////////////////////////////////////////////////////////////////////////////////
function mouseYVentana(){
    //los objetos en el viewport se adpaptan al resize de la ventana
    window.addEventListener('resize', () => {
        //Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        //Update Renderer
        renderer.setSize(sizes.width, sizes.height)
        //ej: para un pixel ratio de 2 se renderizan 4 pixeles por pixel
        //si pixel ratio es 3 se renderizan 9 pixeles por pixel
        //establecemos un maximo de pixelRatio=2
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        //Update Camera
        camara.aspect = sizes.width / sizes.height
        camara.updateProjectionMatrix()
    })
//fullscreen with double click
    document.addEventListener('dblclick', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen()
        } else {
            document.documentElement.requestFullscreen()
        }
    })


//cursor.x = [-1,1] cursor.y = [-1,1] --->cubre toda la pantalla
    window.addEventListener('mousemove', (event) =>
    {
        //normalize the mouse position
        const {x, y} = event
        cursor.x = (x / sizes.width) * 2 - 1
        cursor.y = -(y / sizes.height) * 2 + 1
    })

}

const dimensionesTriangulos = {
    filas : 1,
    columnas : 20,
}

const dimensionesTubo = {
    radio: 0.035,
    altura: 2.0,
}
function guideUserInterface(){
    const gui = new dat.GUI();
    const hideGui = () => {
        gui.hide()
        dat.GUI.toggleHide()
    }
    //hideGui()
    //gui.width = 500
    function recargarMesh() {
        mesh.geometry.dispose()
        mesh2.geometry.dispose()
        mesh2.material.dispose()
        mesh.material.dispose()
        escena.remove(mesh)
        escena.remove(mesh2)
        mesh = crearTubo()
        mesh2 = crearTapa()
        escena.add(mesh)
        escena.add(mesh2)
    }

    gui.add(dimensionesTriangulos, 'filas').min(0).max(10).step(1).onChange(
        () =>{
            recargarMesh()
        }
    )
    gui.add(dimensionesTriangulos, 'columnas').min(0).max(50).step(1).onChange(
        () =>{
            recargarMesh()
        }
    )
    gui.add(dimensionesTubo, 'radio').min(0.01).max(0.1).step(0.001).onChange(
        () =>{
            recargarMesh()
        }
    )
    gui.add(dimensionesTubo, 'altura').min(0.1).max(5).step(0.1).onChange(
        () =>{
            recargarMesh()
        }
    )

    //  gui.add(mesh.rotation, 'x', -1,1,0.01)
    //gui.add(mesh.rotation, 'z').min(-1).max(1).step(0.01).name('zetas')
    gui.add(material, 'wireframe')
    //gui.add(mesh, 'visible')
    gui.addColor(parameters, 'color').onChange(() => {
        mesh.material.color.set(parameters.color)
    })
    gui.add(parameters, 'sprint')
}

function OperacionesParaNormalizar() {
    this.restaArray = function (array1, array2) {
        let resultado = [];
        for (let i = 0; i < array1.length; i++) {
            resultado.push(array1[i] - array2[i]);
        }
        return resultado;
    };
    this.productoCruz = function (a, b) {
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    };
    this.normalizar = function (array) {
        let norm = Math.sqrt(array[0] ** 2 + array[1] ** 2 + array[2] ** 2);
        return [array[0] / norm, array[1] / norm, array[2] / norm];
    };
}


function tapaDeTubo(){
    const tapa = new THREE.Mesh(
        new THREE.CylinderGeometry(
            dimensionesTubo.radio,
            dimensionesTubo.radio,
            dimensionesTubo.altura,
            dimensionesTriangulos.columnas,
            1,
            false
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            side: THREE.DoubleSide,
        })
    )
    tapa.rotation.x = Math.PI / 2
    tapa.position.y = dimensionesTubo.altura / 2
    return tapa
}


function Tapa(radioDeLaTapa){
    let Phi = function (u){
        return 2 * Math.PI * u
    }
    let Radio = function (v){
        return radioDeLaTapa*v
    }
    this.getPosicion = function (u,v ){
        let phi = Phi(u);
        let radio = Radio(v)
        let x = radio * Math.cos(phi);
        let z = radio * Math.sin(phi);
        let y = 0
        return [x, y, z];
    }
    this.getNormal = function (u, v) {
        return [0,-1,0]
    };
    this.getCoordenadasTextura = function (u, v) {
        return [v, u];
    };
}
function Tubo(dimensionesTubo){


    let Phi = function (u){
        return 2 * Math.PI * u
    }
    this.getPosicion = function (u,v ){
        let phi = Phi(u);
        let rho = dimensionesTubo.radio;
        let x = rho * Math.cos(phi);
        let z = rho * Math.sin(phi);
        let y = v * dimensionesTubo.altura;
        return [x, y, z];
    }
    let delta = 0.0001;
    this.getNormal = function (u, v) {
        let operacion = new OperacionesParaNormalizar();

        let punto_0 = this.getPosicion(u, v);
        let punto_1 = this.getPosicion(u , v + delta);
        let punto_2 = this.getPosicion(u + delta, v );

        let vectorParaNormal_1 = operacion.restaArray(punto_0, punto_1);
        let vectorParaNormal_2 = operacion.restaArray(punto_0, punto_2);
        /*
        if (u <= 0.5 && u !== 0) { //corrige cuando u=[0,2PI]
            let vectorAux = vectorParaNormal_1;
            vectorParaNormal_1 = vectorParaNormal_2;
            vectorParaNormal_2 = vectorAux;
        }*/
        let productoCruz = operacion.productoCruz(vectorParaNormal_1, vectorParaNormal_2);
        let normal =operacion.normalizar(productoCruz);
        let normalReal = [Math.cos(2 * Math.PI*u), 0, Math.sin(2 * Math.PI*u)];
        //console.log(normal);
        //console.log(normalReal)
        return normal;
    };

    this.getCoordenadasTextura = function (u, v) {
        return [v, u];
    };
}

function generarSuperficie(superficie, dimensionesTriangulos) {
    const positionBuffer = [];
    const normalBuffer = [];
    const uvBuffer = [];

    for (let i = 0; i <= dimensionesTriangulos.filas; i++) {
        for (let j = 0; j <= dimensionesTriangulos.columnas; j++) {

            let u = j / dimensionesTriangulos.columnas;
            let v = i / dimensionesTriangulos.filas;
            //console.log(u);
            //console.log(v);

            let pos = superficie.getPosicion(u, v);


            positionBuffer.push(pos[0]);
            positionBuffer.push(pos[1]);
            positionBuffer.push(pos[2]);


            let nrm = superficie.getNormal(u, v);


            normalBuffer.push(nrm[0]);
            normalBuffer.push(nrm[1]);
            normalBuffer.push(nrm[2]);

            let uvs = superficie.getCoordenadasTextura(u, v);

            uvBuffer.push(uvs[0]);
            uvBuffer.push(uvs[1]);

        }
    }

    // Buffer de indices de los triángulos
    //  (i,j) , (i, j+1) , (i+1, j+1), (i+1, j)
    const verticesPorFila = dimensionesTriangulos.columnas + 1;
    const indexBuffer = [];

    for (let i = 0; i < dimensionesTriangulos.filas; i++) {
        for (let j = 0; j < dimensionesTriangulos.columnas + 1; j = j + 2) {
            indexBuffer.push(i * verticesPorFila + j);
            indexBuffer.push((i + 1) * verticesPorFila + j);
            indexBuffer.push(i * verticesPorFila + j + 1);
            indexBuffer.push((i + 1) * verticesPorFila + j + 1);
        }
        const l = indexBuffer.length;
        if (!(dimensionesTriangulos.columnas % 2)) { //se corrige las dos ultimas posiciones antes de ir a la sig fila
            //si columnas es par
            indexBuffer[l - 1] = indexBuffer[l - 2];
            indexBuffer[l - 2] = indexBuffer[l - 3];
        } else { //si columnas es impar se agrega dos indices antes de continuar
            indexBuffer.push(indexBuffer[l - 1]);
            indexBuffer.push((i + 1) * verticesPorFila + 0); //el sig indice es
            //la iteracion con i+1 y con j=0.
        }
    }
    indexBuffer.pop(); indexBuffer.pop(); //las dos ultimas pos son innecesarias ya que no quedan filas

    // Creación e Inicialización de los buffers
    /*
    webgl_position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer), gl.STATIC_DRAW);
    webgl_position_buffer.itemSize = 3;
    webgl_position_buffer.numItems = positionBuffer.length / 3;

    webgl_normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer), gl.STATIC_DRAW);
    webgl_normal_buffer.itemSize = 3;
    webgl_normal_buffer.numItems = normalBuffer.length / 3;

    webgl_uvs_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uvs_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvBuffer), gl.STATIC_DRAW);
    webgl_uvs_buffer.itemSize = 2;
    webgl_uvs_buffer.numItems = uvBuffer.length / 2;


    webgl_index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
    webgl_index_buffer.itemSize = 1;
    webgl_index_buffer.numItems = indexBuffer.length;
    */

    return {
        positionBuffer,
        normalBuffer,
        uvBuffer,
        indexBuffer,
    };
}

const material = new THREE.MeshNormalMaterial( {
    color: 0xff0000,
    wireframe: false,
    side: THREE.DoubleSide,
} );
material.flatShading = true;

function crearTapa(dimensionesDeTriangulos, radio){
    return crearSuperficieParametrica(generarSuperficie(new Tapa(radio), dimensionesDeTriangulos));
}

function crearTubo(dimensionesDeTriangulos, dimensionesTubo){
    return crearSuperficieParametrica(generarSuperficie(new Tubo(dimensionesTubo), dimensionesDeTriangulos))

}
function crearSuperficieParametrica(mallaDeTriangulos){

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex( mallaDeTriangulos.indexBuffer);
    geometry.setAttribute( 'position',
        new THREE.Float32BufferAttribute( mallaDeTriangulos.positionBuffer, 3 ) );
    geometry.setAttribute( 'normal',
        new THREE.Float32BufferAttribute( mallaDeTriangulos.normalBuffer, 3 ) );
    geometry.setAttribute('uv',
        new THREE.Float32BufferAttribute( mallaDeTriangulos.uvBuffer, 3 ) );
//geometry.setAttribute( 'color',
    //  new THREE.Float32BufferAttribute( colors, 3 ))
    const geometryTriangleStrip = toTrianglesDrawMode(geometry, THREE.TriangleStripDrawMode)
    return new THREE.Mesh( geometryTriangleStrip, material );
}


function TuboPrincipal(dimensionesTriangulos, dimensionesTubo ){

    const tuboPrincipal= new THREE.Group()
    tuboPrincipal.add(crearTubo(dimensionesTriangulos,  dimensionesTubo))
    tuboPrincipal.add(crearTapa(dimensionesTriangulos, dimensionesTubo.radio))
    return tuboPrincipal
}


function TuboSecundario(dimensionesTriangulos, dimensionesTubo){

    return crearTubo(dimensionesTriangulos, dimensionesTubo)
}



function PanelesSolares(){
    const dimensionesTriangulos = {
        filas : 1,
        columnas : 20,
    }
    const dimensionesTuboPrincipal = {
        radio: 0.035,
        altura: 2.0,
    }
    const dimensionesTuboSecundario = {
        radio: 0.008,
        altura: 0.3,
    }

    //nuevo grupo
    const panelesSolares = new THREE.Group()
    //crear tubo principal
    const meshPrincipal = TuboPrincipal(dimensionesTriangulos, dimensionesTuboPrincipal)
    const matrizDeModeladoTuboPrincipal = new THREE.Matrix4()
    matrizDeModeladoTuboPrincipal.makeRotationFromEuler(new THREE.Euler(-Math.PI/2, 0, 0, 'XYZ'))
    meshPrincipal.applyMatrix4(matrizDeModeladoTuboPrincipal);

    //crear tubo secundario
    const meshSecundario = TuboSecundario(dimensionesTriangulos, dimensionesTuboSecundario)
    let matrizDeModeladoTuboSecundario = new THREE.Matrix4()
    const m1 = new THREE.Matrix4()
    const m2 = new THREE.Matrix4()
    const m0 = new THREE.Matrix4()


    m0.makeTranslation(dimensionesTuboSecundario.altura/2, 0, 0)
    m1.makeTranslation(0, 0, -0.2)
    m2.makeRotationFromEuler(new THREE.Euler(0, Math.PI/2, 0, 'XYZ'))

    matrizDeModeladoTuboSecundario = matrizDeModeladoTuboSecundario
        .multiply(m0)
        .multiply(m1).multiply(m2).multiply(matrizDeModeladoTuboPrincipal)

    meshSecundario.applyMatrix4(matrizDeModeladoTuboSecundario);

    panelesSolares.add(meshPrincipal).add(meshSecundario)

    const siguienteTubo = matrizDeModeladoTuboSecundario.clone()

    //puedo hacer el mesh Principal no visible, y clonarlo, segun la necesitad de longitud
    for(let i = 0; i < 8; i++){
        const mesh = TuboSecundario(dimensionesTriangulos, dimensionesTuboSecundario)
        siguienteTubo.multiplyMatrices(m1,siguienteTubo)
        mesh.applyMatrix4(siguienteTubo)
        panelesSolares.add(mesh)
    }


    const mesh3 = TuboSecundario(dimensionesTriangulos, dimensionesTuboSecundario)
    siguienteTubo.multiplyMatrices(m1,siguienteTubo)
    mesh3.applyMatrix4(siguienteTubo)

    const mesh4 = TuboSecundario(dimensionesTriangulos, dimensionesTuboSecundario)
    siguienteTubo.multiplyMatrices(m1,siguienteTubo)
    mesh4.applyMatrix4(siguienteTubo)

    const mesh5 = TuboSecundario(dimensionesTriangulos, dimensionesTuboSecundario)
    siguienteTubo.multiplyMatrices(m1,siguienteTubo)
    mesh5.applyMatrix4(siguienteTubo)

    const mesh6 = TuboSecundario(dimensionesTriangulos, dimensionesTuboSecundario)
    siguienteTubo.multiplyMatrices(m1,siguienteTubo)
    mesh6.applyMatrix4(siguienteTubo)


    return panelesSolares
}


PanelesSolares()
let time=0
const tick = () =>{
    time+=0.01
    controls.update()
    renderer.render(escena, camara)
    window.requestAnimationFrame(tick)
}

function cargarObjetosALaEscena(){
    escena.add(new THREE.AxesHelper(1.5))
    escena.add(camara)
    escena.add(PanelesSolares())
}

guideUserInterface()
cargarObjetosALaEscena()
mouseYVentana()
tick()
