var fs 		= require('fs')
var path 	= require('path')
var async 	= require('async')
var _ 		= require('underscore')

//	===================================================================
//	Global variables
//	===================================================================

var rawFiles, organizedFiles  = {}

//	===================================================================
//	Functionality
//	===================================================================

var diveMusic = function(URL, filter) {
	var location = path.resolve(__dirname, URL)
	var regex_filter = RegExp(filter.toLowerCase(), 'gi')

	async.series([
		//	Check if the folder exists
		function checkIfExists (cb) {
			fs.exists(location, function (exists) {
				return (exists ? cb() : cb('No existe el directorio ' + location))
			})
		},
		//	Analyze folder content
		function printFolderContent (cb) {
			fs.readdir(location, function (error, results) {
				if (error) {
					return cb(error)
				}
				if (!results || !results.length) {
					return cb('No se han encontrado archivos en ' + location)
				}
				rawFiles = results
				cb()
			})
		},
		//	Filter results by name
		function filterByName (cb) {
			rawFiles = rawFiles.filter(function (rawFile) {
				var lower_filter = rawFile.toLowerCase()
				//	console.log(regex_filter + '.test(\'' + lower_filter + '\') : ' + regex_filter.test(lower_filter))
				return regex_filter.test(lower_filter)
			})
			cb()
		},
		//	Organize files
		function organizeFilesByExtension (cb) {
			for(var i in rawFiles) {
				var extension = path.extname(rawFiles[i]).toLowerCase()
				var filename = path.basename(rawFiles[i], extension)

				if(!extension) {
					extension = 'folders'
				}
				if(!organizedFiles[extension]) {
					organizedFiles[extension] = []
				}
				organizedFiles[extension].push(filename)
			}
			cb()
		},
		//	Order results by name
		function orderResultsByName (cb) {
			for(var i in organizedFiles) {
				organizedFiles[i].sort()
			}
			cb()
		},
		//	Print results in console
		function printResults (cb) {
			console.log('')

			if(_.isEmpty(organizedFiles)) {
				return cb('No se han encontrado resultados en ' + location)
			}

			for(i in organizedFiles) {
				console.log('\t%s:', i.toUpperCase())
				console.log('')
				for(j in organizedFiles[i]) {
					console.log('\t► %s', organizedFiles[i][j])
				}
				console.log('')
			}
			cb()
		}
	], function (error, results) {
		if (error) {
			return console.log(error)
		}
		console.log('')
	})
}

//	===================================================================
//	Usage
//	===================================================================

var usage = function () {
	console.log('Script para buscar, analizar y ordenar archivos de mi carpeta personal.')
	console.log('')
	console.log('PARÁMETROS (entre comillas dobles):')
	console.log('\t1\t\tPath relativo al directorio a analizar.')
	console.log('\t2 (opcional)\tClave de búsqueda')
	console.log('')
	console.log('EJEMPLOS:')
	console.log('node find "../../Music/Electrónica/Electro House" "leon bolier"')
	console.log('node find ./ find')
}

//	===================================================================
//	Main program
//	===================================================================

var main = function (args) {
	if(args.length < 3 || args[2].toLowerCase() == 'usage') {
		return usage()
	}
	return diveMusic(args[2], (args[3] || ''))
}

main(process.argv)