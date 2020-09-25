## Locales script

### Synopsis
```
yarn locales:[download | upload | validate | info]
```

- `download` — download and save translations; defaults to **all** locales but can be specified
  - **-l**, **--locales** — for specific list of space-separated locales
    - **<list_of_locales>...** — locales to download

- `upload` — upload base locale

- `validate` — validate locales translations (defaults to **all** locales):
  - **-R**, **--min** — for only our required locales
  - **-l**, **--locales** — for specific list of space-separated locales
    - **<list_of_locales>...** — locales to validate

- `info` — shows locales info (defaults to `-N -s`):
  - **-N**, **--unused** — for unused base-lang strings
  - **-s**, **--summary** — for all locales translations readiness


### Examples
```
// to download and save all locales
yarn locales:download
// or just 'ja' and 'ru' locales
yarn locales:download --locales ja ru

// to upload english strings
yarn locales:upload

// validate all locales
yarn locales:validate
// or only our required languages
yarn locales:validate --min
// or just 'es', 'ja' and 'ru' locales
yarn locales:validate -l es ja ru

// show info about translations readiness and unused strings
yarn locales:info
```

After download you'll find the output locales in the `src/_locales/` folder.

There is `config.json` with list of minimum required locales and other input data.
