import {Schema} from './Schema';
import {generateInterfaceFile} from './templateHelpers';
import * as glob from 'glob';
import mkdirp = require('mkdirp');
declare function require(moduleName: string): any;

/**
 * Recursively create the output directory if it does not exist already
 * @param directory {string} the output directory to create
 */
async function createOutputDir(directory: string): Promise<any> {
  if (!directory) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    mkdirp(directory, (err: Error) => {
      return err ? reject(err) : resolve();
    });
  });
}

/**
 * Wrapper around glob to promisify it
 * @param globPattern {string} the glob pattern to look for
 * @returns {Promise<Array<string>>} any array of files which match the specified glob pattern
 */
async function promisedGlob(globPattern: string): Promise<Array<string>> {
  return new Promise<Array<string>>((resolve, reject) => {
    glob(globPattern, { realpath: true },  (err, files) => {
      return err ? reject(err) : resolve(files);
    });
  });
}

/**
 * Default export function - create TypeScript interface definitions from the JSON schema files supplied
 * (Note that interfaces are not created if schemas are not of type object)
 * @param globPattern {string} the glob pattern to look for schema files
 * @param outputDirectory {string} the location to write the TypeScript interfaces to
 * @returns {Promise<Array<string>>} promise chain to create and write interfaces. Promise chain returns file names of the interfaces created
 */
export = async function (globPattern: string, outputDirectory: string): Promise<Array<string>> {
  const files = await Promise.all([
    promisedGlob(globPattern),
    createOutputDir(outputDirectory)
  ])
    .then(results => results[0]);

  // if no files, nothing to do
  if (!files || files.length < 1) {
    console.info('No JSON schema files found');
    return Promise.resolve([]);
  }

  const schemas = files.map((file: string) => new Schema(require(file)));

  return Promise.all(schemas.map((schema: Schema) => generateInterfaceFile(schema, schemas, outputDirectory)))
    .then((fileNames: Array<string>) => {
      // remove any empty files
      return fileNames.filter(filename => !!filename);
    });
};
