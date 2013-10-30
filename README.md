AiryBox
=======

AiryBox is Cloud Data Storage based on elFinder web file manager with WebDAV endpoint.
To preserve your privacy, it uses [Identity-Based Privacy] (http://igi64.github.io) (IBP) technology.
IBP at its heart relies on [Identity-Based Encryption Key Generator]( https://github.com/igi64/airykey) running on a trusted device and
identity management/access control based on OAuth 2.0 or OpenID Connect.

There are four basic kinds of IBP cloud service models.

1.) Public Cloud Data Storage/Personal Key Generator. All data are encrypted in your browser and stored on public cloud.
	Encryption keys are generated on your corporate or home computer, tablet or smartphone.
	Due to lack of full HTML5 FileSystem API support in all today's browsers it is not possible to provide fully fledged system in these days.

2.) Public Cloud Data Storage/Personal Key Generator + Pass-through Encryption Proxy Service.
	All data are passing through your encryption proxy service running on premises and stored on public AiryBox cloud data storage.
	Encryption keys are generated on your corporate or home computer, tablet or smartphone.
	
3.) Public Cloud Data Storage/Personal Key Generator + Personal Data Storage.
	Directory and file information are stored encrypted in AiryBox public cloud data storage, but real files are stored on premises where can be shared as WebDAV drive.
	Files can be also accessed and managed through web-based file manager elFinder. Directory and file information are encrypted directly in your browser.
	Encryption keys are generated on your corporate or home computer, tablet or smartphone.

4.) Public Cloud Data Storage/Personal Data Storage.
	Only basic information about private clouds location is stored in AiryBox public cloud data storage. 
	All directory, file information and real files are stored on premises where can be shared as WebDAV drive.
	Files can be also accessed and managed through web-based file manager elFinder. There is no encryption service.
	Personal Cloud in combination with identity management/access control guarantees your data privacy. 
	

AiryBox (3/4) will be fully open sourced in November-December, 2013.
