var _ 				= require('underscore')
var fs 				= require('fs-extra')
var path 			= require('path')
var async 			= require('async')
var util 			= require('util')
var id3 			= require('id3-writer')

//	===================================================================
//	Functionality
//	===================================================================

var count = 0
var total = 0

var fixMP3 = function(URL) {
	var location = path.resolve(__dirname, URL)
	var regex_correcto = /.+\s-\s.+\s\([^\s].+[^\s]\)\.mp3/
	var regex_mix = /\(.+\)/
	var regex_mix_espacios = /\([\s]+.+[\s]+\)/
	var regex_no_artista = /.+\s\(.+\)\.mp3/
	var correctFiles = []
	var modifiedFiles = []
	var completarManualmente = []
	var metadataFiles = []
	var audio_extensions = ['.mp3', '.wav', '.wma', '.flac', '.ogg', '.m4a', '.amr']

	//	Test folders
	//	fs.emptyDirSync(location)
	//	fs.copySync(path.join(__dirname, 'test_backup'), location)

	async.waterfall([
		//	Check if the folder exists
		function checkIfExists (cb) {
			fs.exists(location, function (exists) {
				if(!exists) {
					return cb('No existe el directorio ' + location)
				}
				cb()
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

			    var extension = path.extname(file).toLowerCase()

			    //	Skip undesired audio formats
			    if(audio_extensions.indexOf(extension) == -1) {
			    	return cb1()
			    }

				if(regex_correcto.test(file)) {
					correctFiles.push(file)
					cb1()
				}
				else {
					var old_name = file
					var new_name = file
					
					//	Se carga lo de después de los paréntesis
					new_name = old_name.replace(/\).+/, ')')
					//	Si contiene el string '(Original Mix)', pero no entre paréntesis, o en formato incorrecto
					new_name = new_name.replace(/[^\(][Oo]{1,1}riginal\s[Mm]{1,1}ix[\)]/, ' (Original Mix)')
					new_name = new_name.replace(/[\(][Oo]{1,1}riginal\s[Mm]{1,1}ix[^\)]/, '(Original Mix).')
					new_name = new_name.replace(/[^\(][Oo]{1,1}riginal\s[Mm]{1,1}ix[^\)]/, ' (Original Mix).')
					//	Si le falta "(Original Mix)" al final
					if(!regex_mix.test(new_name)) {
						new_name = path.basename(new_name, extension) + ' (Original Mix)'
					}
					//	Si el nombre del mix está entre espacios
					new_name = new_name.replace(/\([\s]+/, '(')
					new_name = new_name.replace(/[\s]+\)/, ')')
					//	Si nos hemos cargado la extensión
					var regex_extension = new RegExp('$\.' + extension, '')
					if(!regex_extension.test(new_name)) {
						new_name = new_name + extension
					}
					//	Mete datos en el array
					if(old_name != new_name) {
						//	Si se ha corregido algo, pero falta el nombre del artista
						if(new_name.split(' - ').length < 2) {
							completarManualmente.push(new_name)
						}
						modifiedFiles.push({
							'old' : old_name,
							'new' : new_name
						})
						fs.rename(path.join(location, old_name), path.join(location, new_name), cb1)
					}
					else {
						//	Si no se ha modificado porque no se ha localizado el error, lo mete en el array de archivos a modificar manualmente
						completarManualmente.push(old_name)
						cb1()
					}
				}

			}, cb)
		},
		//	Update file names
		function updateFilenames (cb) {

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
		//	Set id3 tags
		function setTags (files, cb) {

			async.each(files, function (file, cb1) {

				var parameter = file

				file = path.join(location, parameter)
				var extension = path.extname(file).toLowerCase()

				var nombre_archivo = path.basename(file, extension)
				var sep = file.split(path.sep)
				var parts = nombre_archivo.split(' - ')
				
				if(extension != '.mp3' || parts.length < 2) {
					count++
					return cb1()
				}
				
				//	Words to uppercase
				for(var i in parts) {
					var words = parts[i].split(' ')
					for(var j in words) {
						words[j] = words[j].charAt(0).toUpperCase() + words[j].slice(1)
					}
					parts[i] = words.join(' ')
				}

				//	Nuevos tags
				var id3data = new id3.Meta({
					"artist"		: parts[1] ? parts[0] : 'Unknown',
					"title" 		: parts[1] || parts[0],
					"album" 		: sep[sep.length - 2],
					"comment" 		: 'Fixed with fixmusicnames.js by @angelmunozs',
					"desc" 			: '',
					"genre" 		: sep[sep.length - 2]
				})
				var id3file = new id3.File(file)

				var writer = new id3.Writer()

				writer.setFile(id3file).write(id3data, function (error) {

					//	Print progress
					var msg = util.format('Procesados %d de %d archivos (%d%%): %s', ++count, total, Math.round(count / total * 10000) / 100, parameter)
					process.stdout.write(msg + '                 \r')

					metadataFiles.push(path.basename(file))
					cb1()
				})
			}, cb)
		}

	], function (error, results) {
		if (error) {
			return console.log(error)
		}
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
		console.log('')
		console.log('Se han actualizado los tags: ')
		for(var i in metadataFiles) {
			console.log('\t► ' + metadataFiles[i])
		}
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
