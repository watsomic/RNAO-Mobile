$:.unshift File.expand_path(__FILE__)
require 'yaml'
require 'fileutils'

YUI_JAR = 'config/yuicompressor-2.4.2.jar'

FileUtils.cd(File.dirname __FILE__)

task :default => [:desktop]

task :desktop, [:test] do |t, args|
  
  CONFIG = load_config('config/desktop.yml')
  args.with_defaults(:test => false)
  CONFIG['run_test'] = args[:test]
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
  
  minify 'javascript'
  minify 'css'
  
  # if args[:test]
  #   copy_files 'test'
  #   
  #   index = "#{CONFIG['destination']}/index.html"
  #   test  = "#{CONFIG['destination']}/#{CONFIG['test'][0]['filename']}"
  #   FileUtils.mv test, index
  # end
  
  puts `open -a "Safari" #{CONFIG['destination']}/index.html`
  # puts `C:\\Program Files (x86)\\Safari\\Safari.exe #{CONFIG['destination']}/index.html`
  
end

task :blackberry, [:task] do |t, args|
  
  CONFIG = load_config('config/blackberry.yml')
  args.with_defaults(:task => 'load-simulator')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
  #copy_files 'data'
  
  # update_image_manifest(CONFIG['destination'])
  
  minify 'javascript'
  minify 'css'
  
  FileUtils.cp( CONFIG['icon'],           CONFIG['destination'] ) if CONFIG['icon']
  FileUtils.cp( CONFIG['loading_screen'], CONFIG['destination'] ) if CONFIG['loading_screen']
  
  exec "ant -f platforms/blackberry/build.xml #{args.task}"
  
end

task 'blackberry-widget', [:task] do |t, args|
  
  CONFIG = load_config('config/blackberry-widget.yml')
  args.with_defaults(:task => 'load-simulator')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
 
  Dir.glob( CONFIG['resources'] ).each do |file|
    FileUtils.cp_r( file, CONFIG['destination']) 
  end
  # copy_files 'data'
  
  # update_image_manifest(CONFIG['destination'])
  
  minify 'javascript'
  minify 'css'
  
  # FileUtils.cp( CONFIG['icon'],           CONFIG['destination'] ) if CONFIG['icon']
  # FileUtils.cp( CONFIG['loading_screen'], CONFIG['destination'] ) if CONFIG['loading_screen']
  
  exec "ant -f platforms/blackberry-widget/build.xml #{args.task}"
  
end

# task :blackberry, [:task] do |t, args|
#   
#   args.with_defaults( :task => 'load-simulator' )
#   
#   config_file = 'config/blackberry.yml'
#   config      = prepare( config_file )
#   
#   process( config['html'],       config['destination'], config_file, :mustache )
#   #process( config['css'],        config['destination'], config_file, :mustache )
#   #process( config['javascript'], config['destination'], config_file, :cat      )
#   process( config['binary'],     config['destination'], config_file, :copy     )
#   
#   copy( config['data'], config['destination'] )
#   update_image_manifest(config['destination'])
#   
#   minify( { :files => config['javascript'], :destination => File.join(config['destination'], 'js'),    :ext => 'js' } )
#   minify( { :files => config['css'],        :destination => File.join(config['destination'], 'style'), :ext => 'css' } )
#   
#   FileUtils.cp( config['icon'],           config['destination'] )  if config['icon']
#   FileUtils.cp( config['loading_screen'], config['destination'] ) if config['loading_screen']
#   
#   exec "ant -f platforms/blackberry/build.xml #{args.task}"
#   
# end

task :ios do |t|
  
  CONFIG = load_config('config/ios.yml')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
 
  Dir.glob( CONFIG['resources'] ).each do |file|
    FileUtils.cp_r( file, CONFIG['destination']) 
  end

  minify 'javascript'
  minify 'css'

  puts `open platforms/ios/RNAO.xcodeproj`

end

task :ipad do |t|
  
  CONFIG = load_config('config/ipad.yml')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
 
  Dir.glob( CONFIG['resources'] ).each do |file|
    FileUtils.cp_r( file, CONFIG['destination']) 
  end
  # copy_files 'data'
  
  # update_image_manifest(CONFIG['destination'])
  
  minify 'javascript'
  minify 'css'
  
  # FileUtils.cp( CONFIG['icon'],           CONFIG['destination'] ) if CONFIG['icon']
  # FileUtils.cp( CONFIG['loading_screen'], CONFIG['destination'] ) if CONFIG['loading_screen']
  
  `open platforms/ipad/RNAO-iPad-iPad.xcodeproj`
  
end

task :palm do |t|
  
  CONFIG = load_config('config/palm.yml')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
 
  Dir.glob( CONFIG['resources'] ).each do |file|
    FileUtils.cp_r( file, CONFIG['destination']) 
  end

  minify 'javascript'
  minify 'css'

  FileUtils.cd( File.join CONFIG['destination'], '..', '..' ) do
    puts `make`
  end
  
end

task :android do |t|
  
  CONFIG = load_config('config/android.yml')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
 
  Dir.glob( CONFIG['resources'] ).each do |file|
    FileUtils.cp_r( file, CONFIG['destination']) 
  end

  minify 'javascript'
  minify 'css'

  FileUtils.cd( File.join CONFIG['destination'], '..', '..' ) do
    puts `android update project -p . -t 1` unless File.exists?('default.properties')
    puts `ant install`
    puts `adb shell am start -a android.intent.action.MAIN -n com.nitobi.rnao/com.nitobi.rnao.StartActivity`
  end
  
end

task :symbian do |t|
  
  CONFIG = load_config('config/symbian.wrt.yml')
  
  clean_build
  
  copy_files 'html'
  copy_files 'binary'
 
  Dir.glob( CONFIG['resources'] ).each do |file|
    FileUtils.cp_r( file, CONFIG['destination']) 
  end

  minify 'javascript'
  minify 'css'

  FileUtils.cd( File.join CONFIG['destination'], '..', '..' ) do
    puts `make`
  end
  
end

task :imagelist do |t|
  require 'json'

  images = []
  input  = File.join(File.dirname(__FILE__), 'www', 'platform', 'blackberry-widget', 'database', 'images')
  output = File.join(File.dirname(__FILE__), 'www', 'platform', 'blackberry-widget', 'database', 'images.json')
  glob   = File.join('*')
  
  FileUtils.cd( input ) do
    Dir.glob( glob ) do |filename|
      images.push(filename)
      puts filename
    end
  end

  File.open(output, 'w') { |f| f.puts images.to_json }
end

task :generate_image_manifest do 
  generate_image_manifest File.join('www', 'platform', 'blackberry-widget', 'database')
end

task :database do
  database_file     = File.join(File.dirname(__FILE__), 'resources', 'database.json');
  database_ios_file = File.join(File.dirname(__FILE__), 'resources', 'database.ios.json');
  
  content = IO.read database_file
  
  # ios
  content.gsub!(/\\["'][^'"]*urlcache[\\\/]([^'"]*)\\["']/im, '\"database/images/\1\"')
  File.open(database_ios_file, 'w') { |f| f.puts content }
  
  # android
  require 'json'
  first  = JSON.parse(content)
  second = first.slice!(first.length/2, first.length-1);
  output1 = File.join(File.dirname(__FILE__), 'resources', 'database.android.1.json');
  output2 = File.join(File.dirname(__FILE__), 'resources', 'database.android.2.json');
  File.open(output1, 'w') { |f| f.puts first.to_json }
  File.open(output2, 'w') { |f| f.puts second.to_json }
end

# Remote the trailing --- for YAML.load compatibility
#
def yaml(filename)
  YAML.load(IO.read(filename).gsub(/---\z/, ''))
end

def load_config(filename)
  yaml(filename)
end

def clean_build
  FileUtils.rm_r    CONFIG['destination'] if File.exists? CONFIG['destination']
  FileUtils.mkdir_p CONFIG['destination']
end

def copy_files(type)
  CONFIG[type].each do |f|
    filename    = f['filename']
    destination = File.join CONFIG['destination'], filename.sub('.android.', '.')
    
    FileUtils.mkdir_p File.dirname(destination)
    
    FileUtils.cp_r "www/#{filename}", destination
  end
end

def minify(type)
  extension  = (type == 'javascript') ? 'js' : 'css'
  directory  = (type == 'javascript') ? 'js' : 'style'
  
  minified_filename = File.join CONFIG['destination'], directory, "minified.#{extension}"
  concat_filename   = File.join CONFIG['destination'], directory, "concat.#{extension}"
  
  File.delete minified_filename if File.exists? minified_filename
  
  FileUtils.mkdir_p File.dirname(minified_filename)
  
  if CONFIG['run_test'] && CONFIG['test'][type]
    CONFIG['test'][type].each { |file| `cat www/#{file['filename']} >> #{concat_filename}` }
  end
  
  `touch #{concat_filename}`
  CONFIG[type].each { |file| `cat www/#{file['filename']} >> #{concat_filename}` }
  
  if (type == 'javascript')
    `java -jar #{YUI_JAR} -o #{minified_filename} #{concat_filename}`
    # `mv #{concat_filename} #{minified_filename}`
  else
    # YUI breaks inline media queries
    `mv #{concat_filename} #{minified_filename}`
  end
  
  File.delete concat_filename if File.exists? concat_filename
end

def prepare(filename)
  config = yaml( filename )
  
  FileUtils.rm_r( config['destination'] ) if File.exists?( config['destination'] )
  FileUtils.mkdir_p( config['destination'] )
  
  config
end

def process(files, destination_directory, config_file, action = :cat)
  
  files.each do |f|
    filename    = f['filename']
    destination = File.join( destination_directory, filename )
    
    FileUtils.mkdir_p( File.dirname destination )
    
    if action == :mustache
      `mustache #{ config_file } www/#{ filename } > #{ destination }`
    elsif action == :cat
      `cat www/#{ filename } > #{ destination }`
    elsif action == :copy
      FileUtils.cp( "www/#{ filename }", destination )
    else
      puts " => Did not process '#{filename}' because the action #{action} is unknown"
    end
  end
  
end

def copy(sources, destination)
  sources.each do |source_hash|
    source = source_hash['filename']
    FileUtils.cp_r( source, File.join(destination, File.basename(source)) )
  end
end

# def minify(options = { :files => [], :destination => nil, :ext => nil })
#   
#   minified_filename = File.join(options[:destination], "minified.#{options[:ext]}")
#   concat_filename   = File.join(options[:destination], "concat.#{options[:ext]}")
#   
#   File.delete(minified_filename) if File.exists? minified_filename
#   
#   FileUtils.mkdir_p( options[:destination] )
#   
#   `touch #{ concat_filename }`  
#   options[:files].each { |file| `cat www/#{ file['filename'] } >> #{ concat_filename }` }
#   
#   `java -jar #{ YUI_JAR } -o #{ minified_filename } #{ concat_filename }`
#   
#   File.delete(concat_filename) if File.exists? concat_filename
# end

def update_image_manifest(directory)
  require 'json'

  images          = []
  cd_directory    = File.join(directory, 'data', 'images')
  glob_directory  = File.join('*')
  json_output     = File.join(directory, 'data', 'images.json')
  
  FileUtils.cd( cd_directory ) do
    Dir.glob( glob_directory ) { |filename| images.push(filename) }
  end

  File.open(json_output, 'w') { |f| f.puts images.to_json }
end

def generate_image_manifest(directory)
  require 'json'

  images          = []
  cd_directory    = File.join(directory, 'images')
  glob_directory  = File.join('*')
  json_output     = File.join(directory, 'images.json')
  
  FileUtils.cd( cd_directory ) do
    Dir.glob( glob_directory ) { |filename| images.push(filename) }
  end

  File.open(json_output, 'w') { |f| f.puts images.to_json }
end
