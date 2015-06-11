var _ 		= require('underscore')
var fs 		= require('fs-extra')
var path 	= require('path')
var glob 	= require('glob')
var util 	= require('util')
var async 	= require('async')

//	===================================================================
//	Global variables
//	===================================================================

var rawFiles, organizedFiles  = {}

//	===================================================================
//	Functionality
//	===================================================================

var copyRandom = function(origen, destino, limit) {
	origen = path.resolve(__dirname, origen)
	destino = path.resolve(__dirname, destino)
	limit = Number(limit)

	async.waterfall([
		//	Check if the origin folder exists
		function checkIfOriginExists (cb) {
			fs.exists(origen, function (exists) {
				return (exists ? cb() : cb('No existe el directorio ' + origen))
			})
		},
		//	Check if the destiny folder exists
		function checkIfDestinyExists (cb) {
			fs.exists(destino, function (exists) {
				return (exists ? cb() : cb('No existe el directorio ' + destino))
			})
		},
		//	Analyze folder content
		function diveFolderContent (cb) {
			glob(path.join(origen, '**', '*.mp3'), {}, function (error, results) {
				if (error) {
					return cb(error)
				}
				if (!results || !results.length) {
					return cb('No se han encontrado archivos en ' + origen)
				}
				else {
					cb(null, results)
				}
			})
		},
		//	Pick random files
		function pickRandomFiles (files, cb) {
			var randomFiles = []
			for(var i = 0; i < Math.min(files.length, limit); i++) {
				randomFiles.push(files[Math.round(Math.random() * files.length)])
			}
			cb(null, randomFiles)
		},
		//	Fix file paths
		function fixFilePaths (files, cb) {
			for(var i in files) {
				files[i] = files[i].replace(/\//gi, path.sep)
			}
			cb(null, files)
		},
		//	Copy results
		function copyFiles (files, cb) {
			var count = 0
			var total = files.length
			async.each(files, function(file, cb1) {
				fs.copy(file, destino, function(error) {
					if(error) {
						return cb1(error)
					}
					//	Print progress
					//	var msg = util.format('Copiados %d de %d archivos (%d%%)', ++count, total, Math.round(count / total * 10000) / 100)
					//	process.stdout.write(msg + '                 \r')
					cb1()
				})
			}, function(error) {
				if(error) {
					return cb(error)
				}
				cb(null, files)
			})
		}
	], function (error, results) {
		if (error) {
			return console.log(error)
		}
		console.log('')
		console.log('Se han copiado %d archivos aleatorios a %s', limit, destino)
		console.log('')
		for(var i in results) {
			console.log('\t► %s', results[i])
		}
		console.log('')
	})
}

//	===================================================================
//	Usage
//	===================================================================

var usage = function () {
	console.log('Script para copiar archivos aleatorios de un directorio y sus subdirectorios.')
	console.log('')
	console.log('PARÁMETROS (entre comillas dobles):')
	console.log('\t1\tPath relativo al directorio origen.')
	console.log('\t1\tPath relativo al directorio destino.')
	console.log('\t1\tLímite numérico')
	console.log('')
	console.log('EJEMPLOS:')
	console.log('node copyrandom ../../Music/Electrónica/House F:\\ 10')
}

//	===================================================================
//	Main program
//	===================================================================

var main = function (args) {
	if(args.length < 5 || args[2].toLowerCase() == 'usage') {
		return usage()
	}
	return copyRandom(args[2], args[3], args[4])
}

main(process.argv)