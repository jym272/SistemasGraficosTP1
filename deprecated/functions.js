
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


/*
function initControls1() {
    utils.configureControls({
        'Light Color': {
            value: utils.denormalizeColor(lightColor),
            onChange: v => gl.uniform4fv(program.uLightDiffuse, utils.normalizeColor(v))
        },

         'Camera Type': {
                        value: camera.type,
                        options: [Camera.ORBITING_TYPE, Camera.TRACKING_TYPE],
                        onChange: v => {
                           camera.goHome();
                            camera.setType(v);
                        }
                    },


        'Go Home': () => camera.goHome(),


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