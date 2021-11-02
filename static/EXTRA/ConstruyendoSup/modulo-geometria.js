
let superficie3D;
let superficie3D_2;

let mallaDeTriangulos;
let mallaDeTriangulos2;

var filas = 50;
var columnas = 50;
//constiables globales para las superficies parametricas
var superficieParametrica = "cilindro"; //esfera, plano
//cilindro
var amplitudCilindro = 0.1;
var longitudDeOndaCilindro = 8;
var alturaCilindro = 3;
var radioCilindro = 1;
//esfera
var radioEsfera = 1;
//plano
var anchoPlano = 3;
var largoPlano = 3;

function crearGeometria() {

    switch (superficieParametrica) {
        case "cilindro":
            menuInicial.showSubfolderCilindro();
            superficie3D_2 = new Esfera(0.4);
            superficie3D = new Tubo();
            break;
        case "esfera":
            menuInicial.showSubfolderEsfera();
            superficie3D = new Esfera(radioEsfera);
            break;
        case "plano":
            menuInicial.showSubfolderPlano();
            superficie3D = new Plano(anchoPlano, largoPlano);
            break;
        default:
            console.log("Superficie parametrica desconocida");
            break;
    }

    mallaDeTriangulos = generarSuperficie(superficie3D, filas, columnas);
    mallaDeTriangulos2 = generarSuperficie(superficie3D_2, filas, columnas);
}

function dibujarGeometria1() {
    //console.log(superficieParametrica)
    crearGeometria();
    dibujarMalla(mallaDeTriangulos);
    dibujarMalla(mallaDeTriangulos2);
}
function dibujarGeometria(superficie3D) {
    dibujarMalla(generarSuperficie(superficie3D, filas, columnas));
}


/*
 * Cilindro con pared senoidal
 * @param: amplitud, longitud de onda, altura y radio
 * --> La amplitud esta en la misma escala del radio y parte desde
 * donde termina el radio. Valor ideal de amplitud ->10%radio
 * --> Longitud de onda = 1 es el recorrido entre 2 crestas consecutivas, depende
 *                      de la cantidad de filas para poder obserconst todas las crestas
 * --> Altura del cilindro, alarga el cilindro, no modifica la longitud de onda
*/
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
};
function Tubo(){
    let radio = 0.04; //hardcodeado
    let altura = 2.0; //hardcodedo
    let Phi = function (u){
        return 2 * Math.PI * u
    }
    this.getPosicion = function (u,v ){
        let phi = Phi(u);
        let rho = radio;
        let x = rho * Math.cos(phi);
        let z = rho * Math.sin(phi);
        let y = v * altura; //se resta 2 para mejorar la visualizacion
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
function tuboSenoidal(amplitud, longitudDeOnda, altura, radio) {
    // rho = radio  , phi = [0, 2PI]

    this.getPosicion = function (u, v) {
        let phi = 2 * Math.PI * u;
        let rho = radio + amplitud * Math.cos(Math.PI * v * 2 * longitudDeOnda);
        let x = rho * Math.cos(phi);
        let z = rho * Math.sin(phi);
        let y = v * altura - 2; //se resta 2 para mejorar la visualizacion
        return [x, y, z];
    };
    //normal en cada vertice
    let delta = 0.000001;
    this.getNormal = function (u, v) {
        op = new OperacionesParaNormalizar();
        a = new Array;
        b = new Array;
        cross = new Array;

        p0 = this.getPosicion(u - delta, v - delta);
        p1 = this.getPosicion(u - delta, v);
        p2 = this.getPosicion(u, v - delta);
        a = op.restaArray(p0, p1);
        b = op.restaArray(p0, p2);
        if (u <= 0.5 && u != 0) { //corrige cuando u=[0,2PI]
            c = a; a = b; b = c;
        }
        cross = op.productoCruz(a, b);
        return op.normalizar(cross);
    };
    //se texturiza de manera aleatoria
    this.getCoordenadasTextura = function (u, v) {
        u = Math.PI * u;
        v = Math.PI * v / 4;
        return [Math.cos(v), Math.sin(v)];
    };

}

function Esfera(radio) {
    // u = [0, 2PI] .... v =[0, PI]
    this.getPosicion = function (u, v) {
        u = 2 * Math.PI * u;
        v = Math.PI * v;
        const y = radio * Math.sin(u) * Math.sin(v);
        const z = radio * Math.cos(u);
        const x = radio * Math.sin(u) * Math.cos(v);
        return [x, y, z];
    };
    //normal en cada vertice
    let delta = 0.00001;
    this.getNormal = function (u, v) {
        op = new OperacionesParaNormalizar();
        a = new Array;
        b = new Array;
        cross = new Array;

        p0 = this.getPosicion(u - delta, v - delta);
        p1 = this.getPosicion(u - delta, v);
        p2 = this.getPosicion(u, v - delta);
        a = op.restaArray(p0, p1);
        b = op.restaArray(p0, p2);
        if (u <= 0.5 && u != 0) { //corrige error en los signos de la esfera
            c = a; a = b; b = c;
        }
        cross = op.productoCruz(a, b);
        //console.log(op.normalizar(cross));
        return op.normalizar(cross);
    };

    //se texturiza de manera aleatoria
    this.getCoordenadasTextura = function (u, v) {
        u = Math.PI * u;
        v = 2 * Math.PI * v;
        return [-Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(u)];
    };

}

function Plano(ancho, largo) {

    this.getPosicion = function (u, v) {

        const x = (u - 0.5) * ancho;
        const z = (v - 0.5) * largo;
        return [x, 0, z];
    };

    this.getNormal = function (u, v) {
        return [0, 1, 0];
    };

    this.getCoordenadasTextura = function (u, v) {
        return [v, u];
    };
}

function generarSuperficie(superficie, filas, columnas) {

    positionBuffer = [];
    normalBuffer = [];
    uvBuffer = [];

    for (let i = 0; i <= filas; i++) {
        for (let j = 0; j <= columnas; j++) {

            let u = j / columnas;
            let v = i / filas;
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
    verticesPorFila = columnas + 1;
    indexBuffer = new Array;

    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas + 1; j = j + 2) {
            indexBuffer.push(i * verticesPorFila + j);
            indexBuffer.push((i + 1) * verticesPorFila + j);
            indexBuffer.push(i * verticesPorFila + j + 1);
            indexBuffer.push((i + 1) * verticesPorFila + j + 1);
        }
        l = indexBuffer.length;
        if (!(columnas % 2)) { //se corrige las dos ultimas posiciones antes de ir a la sig fila
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

    return {
        webgl_position_buffer,
        webgl_normal_buffer,
        webgl_uvs_buffer,
        webgl_index_buffer
    };
}

function dibujarMalla(mallaDeTriangulos) {

    // Se configuran los buffers que alimentaron el pipeline
    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_position_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mallaDeTriangulos.webgl_position_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_uvs_buffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mallaDeTriangulos.webgl_uvs_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_normal_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mallaDeTriangulos.webgl_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mallaDeTriangulos.webgl_index_buffer);

    if (modo != "wireframe") {
        gl.uniform1i(shaderProgram.useLightingUniform, (lighting == "true"));
        /*
            Aqui es necesario modificar la primitiva por triangle_strip
        */
        //gl.TRIANGLES
        gl.drawElements(gl.TRIANGLE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    if (modo != "smooth") {

        gl.uniform1i(shaderProgram.useLightingUniform, false);
        gl.drawElements(gl.LINE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

}

