package edu.emory.cci.aiw.i2b2datadownloader.i2b2;

import edu.emory.cci.aiw.i2b2datadownloader.DataDownloaderXmlException;
import edu.emory.cci.aiw.i2b2datadownloader.comm.I2b2AuthMetadata;
import edu.emory.cci.aiw.i2b2datadownloader.entity.I2b2Concept;
import edu.emory.cci.aiw.i2b2datadownloader.i2b2.pdo.I2b2PdoResultParser;
import edu.emory.cci.aiw.i2b2datadownloader.i2b2.pdo.I2b2PdoResults;
import freemarker.template.*;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.io.StringWriter;
import java.util.*;

public final class I2b2PdoRetriever {

    private static final String I2B2_PDO_URL = "http://172.16.89.128/i2b2/rest/QueryToolService/pdorequest";
    private final Configuration config;
    private final Integer patientSetCollId;
    private final I2b2AuthMetadata i2b2AuthMetadata;

    public I2b2PdoRetriever(I2b2AuthMetadata i2b2AuthMetadata, Integer patientSetCollId) {
        this.i2b2AuthMetadata = i2b2AuthMetadata;
        this.patientSetCollId = patientSetCollId;
        this.config = new Configuration();
        this.config.setClassForTemplateLoading(this.getClass(), "/");
        this.config.setObjectWrapper(new DefaultObjectWrapper());
    }

    public I2b2PdoResults retrieve(Collection<I2b2Concept> concepts) throws DataDownloaderXmlException {
        try {
            Template tmpl = this.config.getTemplate("i2b2_pdo_request.ftl");
            StringWriter writer = new StringWriter();

            String messageId = I2b2CommUtil.generateMessageId();

            Map<String, Object> params = new HashMap<String, Object>();
            params.put("domain", i2b2AuthMetadata.getDomain());
            params.put("username", i2b2AuthMetadata.getUsername());
            params.put("passwordNode", i2b2AuthMetadata.getPasswordNode());
            params.put("messageId", messageId);
            params.put("projectId", i2b2AuthMetadata.getProjectId());
            params.put("patientSetLimit", "100");
            params.put("patientListMax", "1");
            params.put("patientListMin", "6");
            params.put("patientSetCollId", patientSetCollId);
            params.put("items", concepts);

            tmpl.process(params, writer);
            Document respXml = I2b2CommUtil.postXmlToI2b2(I2B2_PDO_URL, writer.toString());
            I2b2PdoResultParser parser = new I2b2PdoResultParser(respXml);
            return parser.parse();
        } catch (IOException e) {
            throw new DataDownloaderXmlException(e);
        } catch (TemplateException e) {
            throw new DataDownloaderXmlException(e);
        } catch (SAXException e) {
            throw new DataDownloaderXmlException(e);
        } catch (ParserConfigurationException e) {
            throw new DataDownloaderXmlException(e);
        }
    }
}
