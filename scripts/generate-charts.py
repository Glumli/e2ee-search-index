import json
import os
import numpy as np
import matplotlib.pyplot as plot

dirname = os.path.dirname(__file__)
resultpath = os.path.join(
    dirname, '../src/resources/testcases/results/01.json')


def generate_charts(skip, querytype):
    labels = []
    plotdata = {}

    with open(resultpath) as json_file:
        data = json.load(json_file)
        # iterate over algorithms
        for alg in data:
            if alg in skip:
                continue
            plotdata[alg] = {'x': [], 'fetches': [],
                             'creation': [], 'time': []}
            labels.append(alg)
            algdata = data[alg]
            for dataset in algdata:
                fetchresults = []
                timeresults = []
                # iterate over testcases
                for result in algdata[dataset]['testcases']:
                    if result['query'].startswith(querytype):
                        fetchresults.append(result['fetches'])
                        timeresults.append(result['time'])

                plotdata[alg]['x'].append(int(dataset))
                plotdata[alg]['fetches'].append(np.mean(fetchresults))
                plotdata[alg]['time'].append(np.mean(timeresults))
                plotdata[alg]['creation'].append(
                    algdata[dataset]['indexCreation'])

    labels = ['bruteForce', 'resourceTypeIndex', 'referenceIndex', 'optimum']
    for alg in labels:
        x = plotdata[alg]['x'][:]
        creation = plotdata[alg]['creation']
        xcreation = zip(x, creation)
        creation = [element for _, element in sorted(xcreation)]
        x.sort()

        plot.plot(x, creation, label=alg)

    plot.legend(loc='upper left')
    plot.title("setup time")
    plot.savefig('out/pdf/creation.pdf')
    plot.savefig('out/png/creation.png')
    plot.clf()

    for alg in labels:
        x = plotdata[alg]['x'][:]
        fetches = plotdata[alg]['fetches']
        xfetches = zip(x, fetches)
        fetches = [element for _, element in sorted(xfetches)]
        x.sort()

        plot.plot(x, fetches, label=alg)

    plot.ylabel("Resources Downloaded")
    plot.xlabel("Years of Medical History")
    plot.legend(loc='upper left')
    plot.title(querytype)
    plot.savefig('out/pdf/' + querytype + '_fetches.pdf')
    plot.savefig('out/png/' + querytype + '_fetches.png')
    plot.clf()

    for alg in labels:
        x = plotdata[alg]['x'][:]
        time = plotdata[alg]['time']
        xtime = zip(x, time)
        time = [element for _, element in sorted(xtime)]
        x.sort()

        plot.plot(x, time, label=alg)

    plot.ylabel("Time/Query")
    plot.xlabel("Years of Medical History")
    plot.legend(loc='upper left')
    plot.title(querytype)
    plot.savefig('out/pdf/' + querytype + '_time.pdf')
    plot.savefig('out/png/' + querytype + '_time.png')
    plot.clf()


querytypes = ['', 'has', 'ref', 'res', 'val']
skip = []

for querytype in querytypes:
    generate_charts(skip, querytype)
