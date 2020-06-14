type SubscriberBody = {
  host: string;
  port: number;
  endpoint: string;
  method?: string;
  prod?: string;
};

export default SubscriberBody;
