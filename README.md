# WeatherSynth

WeatherSynth es un instrumento atmosferico para navegador: toma tu ubicacion,
consulta el clima y convierte viento, lluvia, humedad, temperatura, nubosidad
y hora del dia en una escena visual-sonora dibujable.

La pantalla principal queda casi muda:

- canvas fullscreen
- color atmosferico segun el cielo actual
- dos botones arriba a la derecha
- panel lateral para sintesis, FX, filtro, LFO, particulas y emisores
- modal de informacion con link al repo

## Stack

- `HTML`
- `CSS`
- `JavaScript` modular
- `Canvas 2D`
- `Web Audio API`
- `Geolocation API`
- `Open-Meteo`
- presets en `YAML`

## Ejecutar localmente

Servilo con un servidor estatico:

```bash
python3 -m http.server 8080
```

Despues abri `http://localhost:8080`.

## Uso

1. Abri la pagina.
2. La app lee el cielo real y colorea la escena.
3. El primer trazo activa el audio del navegador.
4. Usa `?` para ver el concepto y la rueda para abrir todo el panel de sintesis.
5. Podes dibujar, cambiar el modo de trazo o crear emisores fijos que disparan solos.

## Presets YAML

Las escenas y voces del sintetizador viven en:

```text
config/sound-presets.yaml
```

El archivo separa:

- `voices`: tipos de sonido clasicos
- `presets`: escenas climaticas
- `defaults`: valores iniciales del engine

## Publicar en GitHub Pages

El repo incluye un workflow en `.github/workflows/pages.yml` que:

- valida sintaxis de los modulos JS con `node --check`
- arma el artifact de Pages
- despliega automaticamente en cada push a `main`

Para activarlo en GitHub:

1. entra a `Settings -> Pages`
2. en `Build and deployment`, usa `GitHub Actions`
3. hace push a `main`
