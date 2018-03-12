{
var functions = {};
var buffer = '';
var f='';
}

start
  =  unit* {return functions;}

unit
  =  func
  /  string
  /  multi_line_comment
  /  single_line_comment
  /  any_char

NamespaceToken    = "namespace"   
AbstractToken     = "abstract"    
ConceptToken      = "concept"     
AssetToken        = "asset"       
TransactionToken  = "transaction" 
EventToken        = "event"       
ParticipantToken  = "participant" 
FromToken         = "from"        

type
 = "transaction"
 / "asset"
 / "event"
 / "concept"
 / "participant"
 

func
  =  m:multi_line_comment spaces? AbstractToken? spaces? type spaces id:identifier {functions[id] = m;}
  /  "function" spaces id:identifier                              {functions[id] = null;}

multi_line_comment
  =  "/*" 
     ( !{return buffer.match(/\*\//)} c:. {buffer += c;  }  )*               
     {
       var temp = buffer; 
       buffer = ''; 
       var temp2=f;
       f='';
       //return "/*" + temp.replace(/\s+/g, '      ');
       return temp;
     }

single_line_comment
  =  "//" [^\r\n]*

identifier
  =  a:([a-z] / [A-Z] / "_") b:([a-z] / [A-Z] / [0-9] /"_")* {return a + b.join("");}

spaces
  =  [ \t\r\n]+ {return "";}

string
  =  "\"" ("\\" . / [^"])* "\""
  /  "'" ("\\" . / [^'])* "'"

any_char
  =  .