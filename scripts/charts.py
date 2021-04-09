import os
import json
import numpy as np

# webpagetest.org/easy
# latency in ms, speed in Mbps
networks = {
    'Slow 3G': {'latency': 400, 'rate': 0.4},
    'Regular 3G': {'latency': 300, 'rate': 1.5},
    'Fast 3G': {'latency': 150, 'rate': 1.6},
    '4G': {'latency': 170, 'rate': 9.0},
    'Cable': {'latency': 28, 'rate': 5.0},
}

# Mbps => Byte/s
MBPS_BS = 125000

AVG_KEY = 'avg'


def addplotdata(plotdata, alg, dataset, querytype, metric, data):
    if not metric in plotdata[alg][dataset][querytype]:
        plotdata[alg][dataset][querytype][metric] = []
    plotdata[alg][dataset][querytype][metric].append(data)

    if not metric in plotdata[alg][dataset][AVG_KEY]:
        plotdata[alg][dataset][querytype][metric] = []
    plotdata[alg][dataset][AVG_KEY][metric].append(data)


def preprocess(data):
    # datalabels = []
    plotdata = {}
    # iterate over algorithms
    for alg in data:
        plotdata[alg] = {}
        algdata = data[alg]
        for dataset in algdata:
            plotdata[alg][dataset] = {}
            plotdata[alg][dataset][AVG_KEY] = {
                'x': [],
                'fetches': [],
                'time_creation': [],
                'time_process': [],
                'size_index': [],
                'size_data': [],
                'size_total': [],
                'calls_data': []
            }
            for result in algdata[dataset]['testcases']:
                querytype = result['query'][0:2]
                if not querytype in plotdata:
                    plotdata[alg][dataset][querytype] = {
                        'fetches': [],
                        'time_creation': [],
                        'time_process': [],
                        'size_index': [],
                        'size_data': [],
                        'size_total': [],
                        'calls_data': [],
                    }

                plotdata = addplotdata(plotdata, alg, dataset, querytype,
                                       'fetches', result['fetches'])
                # plotdata = addplotdata(plotdata, alg, dataset, querytype,
                #                        'time_creation', result['indexCreation'])
                plotdata = addplotdata(plotdata, alg, dataset, querytype,
                                       'time_process', result['time'])
                plotdata = addplotdata(plotdata, alg, dataset, querytype,
                                       'size_data', result['dataSize'])
                plotdata = addplotdata(plotdata, alg, dataset, querytype,
                                       'size_index', result['indexSize'])
                plotdata = addplotdata(plotdata, alg, dataset, querytype,
                                       'calls_data', result['networkCalls'])

                # for network_name in networks:
                #     network = networks[network_name]
                #     fhir_latency = float(result['networkCalls'] *
                #                          network['latency'])
                #     index_latency = float(
                #         network['latency']) if result['indexSize'] != 0 else 0

                #     fhir_loadtime = result['dataSize'] / \
                #         (network['rate'] * MBPS_BS)
                #     index_loadtime = result['indexSize'] / \
                #         (network['rate'] * MBPS_BS)

                #     downloadtime_index = index_latency + index_loadtime
                #     downloadtime_fhir = fhir_latency + fhir_loadtime
                #     downloadtime_total = downloadtime_fhir + downloadtime_fhir
                #     downloadtimes[network_name] = downloadtime_total

            print(plotdata)
            return plotdata


def main():
    result_file = '30'
    dirname = os.path.dirname(__file__)
    resultpath = os.path.join(
        dirname, '../src/resources/testcases/results/' + result_file + '.json')
    with open(resultpath) as json_file:
        data = json.load(json_file)
        plot_data = preprocess(data)


main()
