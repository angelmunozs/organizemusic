var _ 				= require('underscore')
var fs 				= require('fs-extra')
var path 			= require('path')
var async 			= require('async')
var util 			= require('util')
var ffmetadata 		= require('ffmetadata')
var id3 			= require('id3-writer')
var writer 			= new id3.Writer()

//	===================================================================
//	Functionality
//	===================================================================

var count = 0
var total = 0

var fixMP3 = function(URL) {
	var location = path.resolve(__dirname, URL)
	var regex_correcto = /.+\s-\s.+\s\(.+\)\.mp3/
	var regex_mix = /\(.+\)/
	var regex_no_artista = /.+\s\(.+\)\.mp3/
	var correctFiles = []
	var modifiedFiles = []
	var completarManualmente = []

	//	Test folders
	//	fs.emptyDirSync(location)
	//	fs.copySync(path.join(__dirname, 'test_backup'), location)

	async.waterfall([
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
				files = results
				total = files.length
				cb(null, files)
			})
		},
		//	Get mp3 info
		function fixFiles (files, cb) {
			async.each(files, function (file, cb1) {

				//	Print progress
			    var msg = util.format('Procesados %d de %d archivos (%d%%)', ++count, total, Math.round(count / total * 10000) / 100)
			    process.stdout.write(msg + '                 \r')

				if(regex_correcto.test(file)) {
					correctFiles.push(file)
					//	Update metadada
					fixMetadata(path.join(location, file), cb1)
				}
				else {
					var old_name = file
					var new_name = file
					var extension = path.extname(old_name).toLowerCase()
					//	Se carga lo de después de los paréntesis
					new_name = old_name.replace(/\).+/, ')')
					//	Si le falta "(Original Mix)" al final
					if(!regex_mix.test(old_name)) {
						new_name = path.basename(old_name, extension) + ' (Original Mix)'
					}
					//	Si nos hemos cargado la extensión
					var regex_extension = new RegExp('$\\' + extension, '')
					if(!regex_extension.test(new_name)) {
						new_name = new_name + extension
					}
					//	Mete datos en el array
					if(old_name != new_name) {
						modifiedFiles.push({
							'old' : old_name,
							'new' : new_name
						})
						async.series([
							//	Rename file
							function (cb2) {
								fs.rename(path.join(location, old_name), path.join(location, new_name), function () {
									cb2()
								})
							},
							//	Update metadada
							function (cb2) {
								fixMetadata(path.join(location, new_name), cb2)
							}
						], function (error) {
							if(error) {
								return cb1(error)
							}
							cb1()
						})
					}
					else {
						//	Si no se ha modificado porque no se ha localizado el error, lo mete en el array de archivos a modificar manualmente
						completarManualmente.push(old_name)
						cb1()
					}
				}

			}, function(error) {
				if(error) {
					console.log('')
					return cb(error)
				}
				console.log('')
				cb()
			})
		},
		//	Print results in console
		function printResults (cb) {
			console.log('')

			console.log('No se han modificado: ')
			for(var i in correctFiles) {
				console.log('\t► ' + correctFiles[i])
			}
			console.log('')
			console.log('Se han modificado: ')
			for(var i in modifiedFiles) {
				console.log('\t► ' + modifiedFiles[i].old)
				console.log('\t\t→ ' + modifiedFiles[i].new)
			}
			console.log('')
			console.log('Modificar manualmente (algún parámetro desconocido): ')
			for(var i in completarManualmente) {
				console.log('\t► ' + completarManualmente[i])
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
//	Fix mp3 metadada
//	===================================================================

var fixMetadata = function(file, cb) {
	
	var extension = path.extname(file).toLowerCase()
	if(extension != '.mp3') {
		return
	}
	var nombre_archivo = path.basename(file, extension)
	var sep = file.split(path.sep)
	var parts = nombre_archivo.split(' - ')

	//	Nuevos metadatos
	var metadata = {
		"author"		: parts[0],
		"title" 		: parts[1],
		"genre" 		: sep[sep.length - 2],
		"album" 		: sep[sep.length - 2],
		"album_artist" 	: parts[0],
		"comment" 		: 'Fixed with fixmusicnames.js by @angelmunozs',
		"description" 	: '',
		"track" 		: ''
	}
	//	Nuevos tags
	var id3data = new id3.Meta({
		"artist"		: parts[0],
		"title" 		: parts[1],
		"album" 		: sep[sep.length - 2],
		"comment" 		: 'Fixed with fixmusicnames.js by @angelmunozs',
		"desc" 			: '',
		"genre" 		: sep[sep.length - 2],
		"track" 		: ''
	})
	var file = new id3.File(file)

	async.parallel([
		//	Update metadata
		function (cb1) {
			ffmetadata.write(file, metadata, function(error) {
			    if(error) {
			    	return cb1(error)
			    }
			    cb1()
			})
		},
		//	Update id3 tags
		function (cb1) {
			writer.setFile(file).write(id3data, function(err) {
				if(error) {
					return cb1(error)
				}
				cb1()
			})
		}
	], function (error) {
		if(error) {
			return cb(error)
		}
		cb()
	})
}

//	===================================================================
//	Usage
//	===================================================================

var usage = function () {
	console.log('Script para renombrar archivos mp3 conforme a un estándar Artista - Título.')
	console.log('')
	console.log('PARÁMETROS (entre comillas dobles):')
	console.log('\t1\t\tPath relativo al directorio a analizar.')
	console.log('')
	console.log('EJEMPLOS:')
	console.log('node fixmp3 "../../Music/Electrónica/UK Garage"')
}

//	===================================================================
//	Main program
//	===================================================================

var main = function (args) {
	if(args.length < 3 || args[2].toLowerCase() == 'usage') {
		return usage()
	}
	return fixMP3(args[2])
}

main(process.argv)