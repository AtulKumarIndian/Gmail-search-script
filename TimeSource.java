import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class TimeSource{
    public static void main(String[] args){
        System.out.println("hey");
        String source = "TARSAN";
        String tarsanTimestamp = "2024-09-05T04:56:39.120Z";
        String dtdTimeStamp = "2024-08-23T15:37:08+08:00";

        String dateTime = getUTcStringTimeStamp(tarsanTimestamp, source);
        System.out.println(dateTime);
     }
      
    public static String getUTcStringTimeStamp(String timestamp, String source){
    
           String dateStringUTC = null;
        DateTimeFormatter dateTimeFormatterUTC = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss'Z'");

        try {
            OffsetDateTime offsetDateTime;

            if ("tarsan".equalsIgnoreCase(source)) {
                // Parse as Instant since 'Z' indicates UTC
                Instant instant = Instant.parse(timestamp);

                System.out.println("Instant "+ instant);

                // Convert Instant to OffsetDateTime in UTC
                offsetDateTime = instant.atOffset(ZoneOffset.UTC);

                System.out.println(offsetDateTime + " is offSetDateTime for source: "+ source);
            } else {
                // For other sources, parse directly with ISO_DATE_TIME
                offsetDateTime = OffsetDateTime.parse(timestamp, DateTimeFormatter.ISO_DATE_TIME);

                System.out.println(offsetDateTime + " is offSetDateTime for source: "+ source);
            }

            // Convert to UTC if needed and format
            dateStringUTC = offsetDateTime.withOffsetSameInstant(ZoneOffset.UTC).format(dateTimeFormatterUTC);
            System.out.println(dateStringUTC+ "is dateStringUTC");
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dateStringUTC;
    }
    
}



