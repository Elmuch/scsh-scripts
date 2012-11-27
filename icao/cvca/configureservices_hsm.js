/**
 *  ---------
 * |.##> <##.|  Open Smart Card Development Platform (www.openscdp.org)
 * |#       #|  
 * |#       #|  Copyright (c) 1999-2010 CardContact Software & System Consulting
 * |'##> <##'|  Andreas Schwier, 32429 Minden, Germany (www.cardcontact.de)
 *  --------- 
 *
 *  This file is part of OpenSCDP.
 *
 *  OpenSCDP is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License version 2 as
 *  published by the Free Software Foundation.
 *
 *  OpenSCDP is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with OpenSCDP; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 * 
 * @fileoverview Configure services
 */

// --- Global settings ---

// The base URL at which services respond to webservice requests
var url = "http://localhost:8080";
// var url = "https://localhost:8443";

// The data directory for keys, requests, certificates and configurations
var datadir = "c:/data/eacpki";

// Allocate card
var card = new Card();
card.reset(Card.RESET_COLD);
var sc = new SmartCardHSM(card);



var bookmarkservicelist = ["CVCA", "DVCA", "TCC", "CVCA-FU", "HSM" ];

function createBookmarks(ui, myself)  {
	for (var i = 0; i < bookmarkservicelist.length; i++) {
		var sn = bookmarkservicelist[i];
		var bm = myself == sn ? ">" + sn : sn;
		ui.addBookmark(bm, "http://localhost:8080/se/" + sn.toLowerCase());
	}
}



// --- CVCA section ---

// Create an CVCA service
var certstore = new HSMCVCertificateStore(datadir +  "/cvca", sc);
var cvca = new CVCAService(certstore, "/UTCVCA");

// The policy used to issue self-signed root certificates
var rootPolicy = { certificateValidityDays: 6,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("E3", HEX),
				   includeDomainParameter: true,
				   shellModelForExpirationDate: false,
				   extensions: null
				 };

cvca.setRootCertificatePolicy(rootPolicy);

// The policy used to issue link certificates
var linkPolicy = { certificateValidityDays: 6,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("E3", HEX),
				   includeDomainParameter: true,
				   shellModelForExpirationDate: false,
				   extensions: null
				 };

cvca.setLinkCertificatePolicy(linkPolicy);

// The policy used to issue DV certificates
var dVPolicy = { certificateValidityDays: 4,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("A3", HEX),
				   includeDomainParameter: false,
				   shellModelForExpirationDate: true,
				   extensions: null,
				   authenticatedRequestsApproved: false,
				   initialRequestsApproved: false,
				   declineExpiredAuthenticatedRequest: true,
				   authenticatedRequestsForwarded: true,
				   countersignedRequestsApproved: false
				 };

// Default policy
cvca.setDVCertificatePolicy(dVPolicy);

var dVPolicy = { certificateValidityDays: 4,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("A3", HEX),
				   includeDomainParameter: false,
				   shellModelForExpirationDate: true,
				   extensions: null,
				   authenticatedRequestsApproved: true,
				   initialRequestsApproved: false,
				   declineExpiredAuthenticatedRequest: true,
				   authenticatedRequestsForwarded: true,
				   countersignedRequestsApproved: false
				 };

// Policy for DVCAs operated by UT
cvca.setDVCertificatePolicy(dVPolicy, /^UT.*$/);

var spoc = { country: "FU", name: "Other country", holderIDs: ["FUCVCA"], url: "http://localhost:8080/se/spoc-fu", async: false };
cvca.addSPOC(spoc);


// Create GUI
var cvcaui = new CVCAUI(cvca);
createBookmarks(cvcaui, "CVCA");

SOAPServer.registerService("cvca", cvca.getTR3129ServicePort(), cvcaui);
SOAPServer.registerService("spoc", cvca.getSPOCServicePort(), cvcaui);



// Create a CVCA for a foreign country
var certstore = new HSMCVCertificateStore(datadir +  "/cvca-fu", sc);
var cvca = new CVCAService(certstore, "FUCVCA");
cvca.setRootCertificatePolicy(rootPolicy);
cvca.setLinkCertificatePolicy(linkPolicy);

var dVPolicy = { certificateValidityDays: 4,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("63", HEX),
				   includeDomainParameter: false,
				   shellModelForExpirationDate: true,
				   extensions: null,
				   authenticatedRequestsApproved: true,
				   initialRequestsApproved: false,
				   declineExpiredAuthenticatedRequest: true,
				   authenticatedRequestsForwarded: true,
				   countersignedRequestsApproved: false
				 };

cvca.setDVCertificatePolicy(dVPolicy);

var spoc = { country: "UT", name: "Utopia",  holderIDs: ["UTCVCA"], url: "http://localhost:8080/se/spoc", async: true };
cvca.addSPOC(spoc);

// Create GUI
var cvcaui = new CVCAUI(cvca);
createBookmarks(cvcaui, "CVCA-FU");

SOAPServer.registerService("cvca-fu", cvca.getTR3129ServicePort(), cvcaui);
SOAPServer.registerService("spoc-fu", cvca.getSPOCServicePort(), cvcaui);


// --- DVCA section ---

// Create a DVCA service

var certstore = new HSMCVCertificateStore(datadir +  "/dvca", sc);
var dvca = new DVCAService(certstore, "/UTCVCA/UTDVCA", url + "/se/cvca");
// var dvca = new DVCAService(datadir + "/dvca", "UTDVCA", "UTCVCA");
dvca.setSendCertificateURL(url + "/se/dvca");

var terminalPolicy = { certificateValidityDays: 6,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("23", HEX),
				   includeDomainParameter: false,
				   shellModelForExpirationDate: true,
				   extensions: null,
				   authenticatedRequestsApproved: true,
				   initialRequestsApproved: false,
				   declineExpiredAuthenticatedRequest: true
				 };

dvca.setTerminalCertificatePolicy(terminalPolicy);

var terminalPolicyVT = { certificateValidityDays: 6,
				   chatRoleOID: new ByteString("id-IS", OID),
				   chatRights: new ByteString("23", HEX),
				   includeDomainParameter: false,
				   shellModelForExpirationDate: true,
				   extensions: null,
				   authenticatedRequestsApproved: true,
				   initialRequestsApproved: true,
				   declineExpiredAuthenticatedRequest: true
				 };

dvca.setTerminalCertificatePolicy(terminalPolicyVT, /UTVT/);
dvca.setTerminalCertificatePolicy(terminalPolicyVT, /UTTM/);



// Create GUI
var dvcaui = new DVCAUI(dvca);
createBookmarks(dvcaui, "DVCA");

SOAPServer.registerService("dvca", dvca.getTR3129ServicePort(), dvcaui);



// --- TCC section ---

// Create TCC service
var certstore = new HSMCVCertificateStore(datadir +  "/tcc", sc);
var tcc = new TCCService(certstore, "/UTCVCA/UTDVCA/UTTERM", url + "/se/dvca");
tcc.setSendCertificateURL(url + "/se/tcc");

// Create GUI
var tccui = new TCCUI(tcc);
createBookmarks(tccui, "TCC");

SOAPServer.registerService("tcc", tcc.getTR3129ServicePort(), tccui);


var hsmui = new HSMUI(sc);
createBookmarks(hsmui, "HSM");

SOAPServer.registerService("hsm", null, hsmui);