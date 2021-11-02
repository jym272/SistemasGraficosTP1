'use strict';

export class ConstruirBuffers{
    // Constructor
    constructor() {

    }
   // Método que construye los buffers
   construir(superficie, dimensionesTriangulos){
       const positionBuffer = [];
       const normalBuffer = [];
       const uvBuffer = [];

       for (let i = 0; i <= dimensionesTriangulos.filas; i++) {
           for (let j = 0; j <=  dimensionesTriangulos.columnas; j++) {

               let u = j /  dimensionesTriangulos.columnas;
               let v = i /  dimensionesTriangulos.filas;
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
       const verticesPorFila =  dimensionesTriangulos.columnas + 1;
       const indexBuffer = [];

       for (let i = 0; i <  dimensionesTriangulos.filas; i++) {
           for (let j = 0; j <  dimensionesTriangulos.columnas + 1; j = j + 2) {
               indexBuffer.push(i * verticesPorFila + j);
               indexBuffer.push((i + 1) * verticesPorFila + j);
               indexBuffer.push(i * verticesPorFila + j + 1);
               indexBuffer.push((i + 1) * verticesPorFila + j + 1);
           }
           const l = indexBuffer.length;
           if (!( dimensionesTriangulos.columnas % 2)) { //se corrige las dos ultimas posiciones antes de ir a la sig fila
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

       //malla de triangulos
       return {
           positionBuffer,
           normalBuffer,
           uvBuffer,
           indexBuffer,
       };
   }


}