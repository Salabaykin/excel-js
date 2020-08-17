const path = require('path') // подключаем пакет path для того, чтобы правильно указвывать контекст 
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

// packed.json => 
// "start": "webpack" - запускает webpack в режиме разработки: КОМАНДА - NPM RUN START
// "start": "cross-env NODE_ENV=development webpack" 
// cross-env NODE_ENV=development - указываем режим разработки 
// "start": "cross-env NODE_ENV=development webpack-dev-server --open"
// webpack-dev-server - для того, чтобы все динамически обновлялось без создания папки dist. 
// --open - автоматически открывает в браузере 
// "build": "webpack --mode production" - собирает все для моды продакшен: КОМАНДА - NPM RUN BUILD
// "build": "cross-env NODE_ENV=production webpack --mode production" 
// cross-env NODE_ENV=production - указываем режим продакшена

// Определяем в каком режиме сборки мы находимся - определяется через process.env.NODE_ENV - задает системную переменную 
const isProd = process.env.NODE_ENV === 'production' // Режим Продакшена 
const isDev = !isProd // Режим Разработки

// Меняем название файлов в зависимости от моды (production или development)
const filename = ext => isDev ? `bundle.${ext}` : `bundle.[hash].${ext}`
// [hash] - добавляет рандомные буквы/числа к названию - нужно для того, чтобы избежать проблем с кешированием 

const jsLoaders = () => {
  const loaders = [
    {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env']
      }
    }
  ]

  if (isDev) {
    loaders.push('eslint-loader')
  }

  return loaders
}

module.exports = {
  // БАЗОВАЯ НАСТРОЙКА
  context: path.resolve(__dirname, 'src'), // отвечает за то, где лежат все наши исходники для работы
  // __dirname - отвечает за путь абсолютный до текущей папки 
  // Метод resolve() возвращает в итоге строку с абсолютным путем до файла
  mode: 'development', // в режиме разработки 
  entry: ['@babel/polyfill', './index.js'], // входная точка для приложения 
  output: { 
    filename: filename('js'), // название файла, где будут все наши js файлы 
    path: path.resolve(__dirname, 'dist') // куда будем все складываем - в папку dist
  },
  // =================

  resolve: {
    extensions: ['.js'], // Грузит по умолчанию js (Если есть json, то указываем и его) 
    alias: { // Элиас - служит для того, чтобы можно было быстро обращаться по коротким ссылкам 
      // ПРИМЕР: import '../../../src/../' - вместо такой длинной ссылки мы будем писать '@'
      '@': path.resolve(__dirname, 'src'), // Прописывая @ - мы будем сразу обращаться к папке src 
      '@core': path.resolve(__dirname, 'src/core')
    }
  },

  // Добавим SourceMap 
  devtool: isDev ? 'source-map' : false,

  // Добавим плагин webpack-dev-server для того, чтобы при разработке все динамически обновлялось после внесения изменений в коде
  devServer: { 
    port: 4000, // указываем порт - можно любой 
    hot: isDev // добавляем hot, если мы в режиме разработки
  },

  // Добавляем плагины для WebPack 
  plugins: [
    new CleanWebpackPlugin(), // Чистит необходимую папку - а именно - dist
    new HtmlWebpackPlugin({
      template: 'index.html', // откуда берем шаблон для HTML, указываем для того, чтобы плагин сам не генерировал этот файл 
      minify: { // Для минификации HTML файла 
        removeComments: isProd, // Удаляет комментарии - isProd = true/false
        collapseWhitespace: isProd // Удаляет лишние пробелы - isProd = true/false
      }
    }),
    new CopyPlugin({ // Для перетаскивания favicon и т.д. (Копирует файлы из одной папки в другую)
      patterns: [
        { 
          from: path.resolve(__dirname, 'src/favicon.ico'), 
          to: path.resolve(__dirname, 'dist')
        }
      ],
    }),
    new MiniCssExtractPlugin({ // Выносит css из js (index.js) в отдельный файл css 
      filename: filename('css') // Указываем название нового файла 
    })
  ],

  // Подключаем Лоадеры (loader) - обновление странцы 
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i, // Тестируем расширения SASS|SCSS
        use: [
          {
            loader: MiniCssExtractPlugin.loader, // обновляем страницу при изменении css-кода
            options: {
              hmr: isDev,
              reloadAll: true
            }
          }, 
          'css-loader',
          'sass-loader', // Компилируем SASS/SCSS в => CSS
        ],
      },
      { // Пропустим js через babel, чтобы наш код работал и в старых браузерах 
        test: /\.js$/, 
        exclude: /node_modules/, 
        use: jsLoaders,
      }
    ],
  }
}