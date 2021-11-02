'use strict';


export class Tubo{
    constructor(dimensionesTriangulos= { filas : 1,columnas : 20,},
                dimensionesTubo= { radio: 1.0, altura: 10.0,})
    {
        this.alias = 'tubo';

        this.dimensionesTriangulos = dimensionesTriangulos;
        this.dimensionesTubo = dimensionesTubo;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.wireframe = false;
        this.visible = true;

        this.construir(this.dimensionesTriangulos, this.dimensionesTubo);
    }
    construir(dimensionesTriangulos){
        const positionBuffer = [];
        const normalBuffer = [];
        const uvBuffer = [];

        for (let i = 0; i <= dimensionesTriangulos.filas; i++) {
            for (let j = 0; j <= dimensionesTriangulos.columnas; j++) {

                let u = j / dimensionesTriangulos.columnas;
                let v = i / dimensionesTriangulos.filas;
                //console.log(u);
                //console.log(v);

                let pos = this.getPosicion(u, v);


                positionBuffer.push(pos[0]);
                positionBuffer.push(pos[1]);
                positionBuffer.push(pos[2]);


                let nrm = this.getNormal(u, v);


                normalBuffer.push(nrm[0]);
                normalBuffer.push(nrm[1]);
                normalBuffer.push(nrm[2]);

                let uvs = this.getCoordenadasTextura(u, v);

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
        this.vertices = positionBuffer;
        this.indices = indexBuffer;
        this.normales = normalBuffer;
        console.log(this.vertices.length);
        console.log(this.indices.length);
        /*
        return {
            positionBuffer,
            normalBuffer,
            uvBuffer,
            indexBuffer,
        };

         */
    }
        restaArray(array1, array2){
            let resultado = [];
            for (let i = 0; i < array1.length; i++) {
                resultado.push(array1[i] - array2[i]);
            }
            return resultado;
        };
        productoCruz(a, b){
            return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        };
        normalizar(array){
            let norm = Math.sqrt(array[0] ** 2 + array[1] ** 2 + array[2] ** 2);
            return [array[0] / norm, array[1] / norm, array[2] / norm];
        };

        Phi (u){
            return 2 * Math.PI * u
        }
        getPosicion(u,v ){
            let phi = this.Phi(u);
            let rho = this.dimensionesTubo.radio;
            let x = rho * Math.cos(phi);
            let z = rho * Math.sin(phi);
            let y = v * this.dimensionesTubo.altura;
            return [x, y, z];
        }
        getNormal (u, v) {
            const delta = 0.0001;

            let punto_0 = this.getPosicion(u, v);
            let punto_1 = this.getPosicion(u , v + delta);
            let punto_2 = this.getPosicion(u + delta, v );

            let vectorParaNormal_1 = this.restaArray(punto_0, punto_1);
            let vectorParaNormal_2 = this.restaArray(punto_0, punto_2);
            /*
            if (u <= 0.5 && u !== 0) { //corrige cuando u=[0,2PI]
                let vectorAux = vectorParaNormal_1;
                vectorParaNormal_1 = vectorParaNormal_2;
                vectorParaNormal_2 = vectorAux;
            }*/
            let productoCruz = this.productoCruz(vectorParaNormal_1, vectorParaNormal_2);
            let normal =this.normalizar(productoCruz);
            let normalReal = [Math.cos(2 * Math.PI*u), 0, Math.sin(2 * Math.PI*u)];
            //console.log(normal);
            //console.log(normalReal)
            return normalReal;
        };

        getCoordenadasTextura(u, v) {
            return [v, u];
        }

}