# organizemusic
A compilation of scripts to organize your music

### Requirements
- node.js
- pyhton

## fixmusicnames.js
### Functionality
Searches for music inside a folder, and fixes __file names__, __metadata__ and __id3 tags__.

Designed for electronic music, so the file names folow the criteria: __Artist - Title (Mix)__

### Examples
I have a floder called Techno, that contains the files:
- Crookers - Able to maximize (Digi Remix) [Mp3elite.net]
- Harvey Mckay - The End
- Lorenzo D'Ianni - Danger man www.futureelectrohitsdownload.blogspot.com

After executing the following:

```sh
node fixmusicnames ../../Music/Techno`
```

The folder content will be:
- Crookers - Able To Maximize (Digi Remix)
- Harvey Mckay - The End (Original Mix)
- Lorenzo D'Ianni - Danger man (Original Mix)

Metadata and id3 tags will also be changed as follows (only MP3 files):
- __artist__: First part of the file name (e.g, 'Crookers')
- __title__: Second part of the file name (e.g, 'Able To Maximize (Digi Remix)')
- __genre__: Folder name (e.g, 'Techno')
- __album__: Folder name (e.g, 'Techno')
- __description__: Empty
- __track__ (track number): Empty

A message in the console shows the name of the files that have been changed.

## find.js
### Functionality
Quick search of content inside a folder.

### Examples
I have a floder called Techno, that contains the files:
- Crookers - Able To Maximize (Digi Remix)
- Harvey Mckay - The End (Original Mix)
- Lorenzo D'Ianni - Danger man (Original Mix)

After executing the following:

```sh
node find ../../Music/Techno "original mix"
```

A message like this will be shown:

```sh
.MP3:

    ► Harvey Mckay - The End (Original Mix)
    ► Lorenzo D'Ianni - Danger man (Original Mix)
```
